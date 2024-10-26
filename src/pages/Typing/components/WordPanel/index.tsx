import { TypingContext, TypingStateActionType } from '../../store'
import type { TypingState } from '../../store/type'
import PrevAndNextWord from '../PrevAndNextWord'
import Progress from '../Progress'
import Phonetic from './components/Phonetic'
import Translation from './components/Translation'
import WordComponent from './components/Word'
import { usePrefetchPronunciationSound } from '@/hooks/usePronunciation'
import { isReviewModeAtom, isShowPrevAndNextWordAtom, loopWordConfigAtom, phoneticConfigAtom, reviewModeInfoAtom } from '@/store'
import type { Word } from '@/typings'
import { IsDesktop } from '@/utils'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

export default function WordPanel() {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!
  const phoneticConfig = useAtomValue(phoneticConfigAtom)
  const isShowPrevAndNextWord = useAtomValue(isShowPrevAndNextWordAtom)
  const [wordComponentKey, setWordComponentKey] = useState(0)
  const [currentWordExerciseCount, setCurrentWordExerciseCount] = useState(0)
  const { times: loopWordTimes } = useAtomValue(loopWordConfigAtom)
  const currentWord = state.chapterData.words[state.chapterData.index]
  const nextWord = state.chapterData.words[state.chapterData.index + 1] as Word | undefined

  const setReviewModeInfo = useSetAtom(reviewModeInfoAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  const prevIndex = useMemo(() => {
    const newIndex = state.chapterData.index - 1
    return newIndex < 0 ? 0 : newIndex
  }, [state.chapterData.index])
  const nextIndex = useMemo(() => {
    const newIndex = state.chapterData.index + 1
    return newIndex > state.chapterData.words.length - 1 ? state.chapterData.words.length - 1 : newIndex
  }, [state.chapterData.index, state.chapterData.words.length])

  usePrefetchPronunciationSound(nextWord?.name)

  const reloadCurrentWordComponent = useCallback(() => {
    setWordComponentKey((old) => old + 1)
  }, [])

  const updateReviewRecord = useCallback(
    (state: TypingState) => {
      setReviewModeInfo((old) => ({
        ...old,
        reviewRecord: old.reviewRecord ? { ...old.reviewRecord, index: state.chapterData.index } : undefined,
      }))
    },
    [setReviewModeInfo],
  )

  const onFinish = useCallback(() => {
    //setIsMobile(true)
    if (state.chapterData.index < state.chapterData.words.length - 1 || currentWordExerciseCount < loopWordTimes - 1) {
      // 用户完成当前单词
      if (currentWordExerciseCount < loopWordTimes - 1) {
        setCurrentWordExerciseCount((old) => old + 1)
        dispatch({ type: TypingStateActionType.LOOP_CURRENT_WORD })
        reloadCurrentWordComponent()
      } else {
        setCurrentWordExerciseCount(0)
        if (isReviewMode) {
          dispatch({
            type: TypingStateActionType.NEXT_WORD,
            payload: {
              updateReviewRecord,
            },
          })
        } else {
          dispatch({ type: TypingStateActionType.NEXT_WORD })
        }
      }
    } else {
      // 用户完成当前章节
      dispatch({ type: TypingStateActionType.FINISH_CHAPTER })
      if (isReviewMode) {
        setReviewModeInfo((old) => ({ ...old, reviewRecord: old.reviewRecord ? { ...old.reviewRecord, isFinished: true } : undefined }))
      }
    }
  }, [
    state.chapterData.index,
    state.chapterData.words.length,
    currentWordExerciseCount,
    loopWordTimes,
    dispatch,
    reloadCurrentWordComponent,
    isReviewMode,
    updateReviewRecord,
    setReviewModeInfo,
  ])

  const onSkipWord = useCallback(
    (type: 'prev' | 'next') => {
      if (type === 'prev') {
        dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: prevIndex })
      }

      if (type === 'next') {
        dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: nextIndex })
      }
    },
    [dispatch, prevIndex, nextIndex],
  )

  useHotkeys(
    'Ctrl + Shift + ArrowLeft',
    (e) => {
      e.preventDefault()
      onSkipWord('prev')
    },
    { preventDefault: true },
  )

  useHotkeys(
    'Ctrl + Shift + ArrowRight',
    (e) => {
      e.preventDefault()
      onSkipWord('next')
    },
    { preventDefault: true },
  )
  const [isShowTranslation, setIsHoveringTranslation] = useState(false)

  const handleShowTranslation = useCallback((checked: boolean) => {
    setIsHoveringTranslation(checked)
  }, [])

  useHotkeys(
    'tab',
    () => {
      handleShowTranslation(true)
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  useHotkeys(
    'tab',
    () => {
      handleShowTranslation(false)
    },
    { enableOnFormTags: true, keyup: true, preventDefault: true },
    [],
  )

  const shouldShowTranslation = useMemo(() => {
    return isShowTranslation || state.isTransVisible
  }, [isShowTranslation, state.isTransVisible])

  const [shuffled, setShuffled] = useState<string[]>([])
  const [randomNumbers, setRandomNumbers] = useState<number[]>([])

  useEffect(() => {
    if (currentWord) {
      const uniqueLetters = Array.from(new Set(currentWord.name.split('')))
      const shuffledLetters = [...uniqueLetters].sort((a, b) => a.localeCompare(b))
      setShuffled(shuffledLetters)
      const newRandomNumbers = shuffledLetters.map(() => Math.floor(Math.random() * 5) + 1)
      setRandomNumbers(newRandomNumbers)
    } else {
      setShuffled([])
      setRandomNumbers([])
    }
  }, [currentWord?.name]) // Only re-run when currentWord.name changes

  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      {!isMobile && (
        <div className="container flex h-24 w-full shrink-0 grow-0 justify-between px-12 pt-10">
          {isShowPrevAndNextWord && state.isTyping && (
            <>
              <PrevAndNextWord type="prev" />
              <PrevAndNextWord type="next" />
            </>
          )}
        </div>
      )}
      <div className="container flex flex-grow flex-col items-center justify-center">
        {currentWord && (
          <div className="relative flex w-full justify-center">
            {!state.isTyping && (
              <div className="absolute flex h-full w-full justify-center">
                <div className="z-10 flex w-full items-center backdrop-blur-sm">
                  <p className="w-full select-none text-center text-xl text-gray-600 dark:text-gray-50">
                    按任意键{state.timerData.time ? '继续' : '开始'}
                  </p>
                </div>
              </div>
            )}
            <div className="relative">
              <WordComponent word={currentWord} onFinish={onFinish} key={wordComponentKey} />
              {phoneticConfig.isOpen && <Phonetic word={currentWord} />}
              <Translation
                trans={currentWord.trans.join('；')}
                showTrans={shouldShowTranslation}
                onMouseEnter={() => handleShowTranslation(true)}
                onMouseLeave={() => handleShowTranslation(false)}
              />
            </div>
          </div>
        )}
      </div>

      {!IsDesktop() && currentWord && (
        <>
          <div className="mb-9 mt-4 w-screen text-center text-sm text-gray-500">
            {shuffled.slice(0, 5).map((letter, index) => {
              return (
                <span
                  key={`${currentWord.name}-${index}`}
                  onClick={(e) => {
                    console.log(letter)
                    const keyboardEvent = new KeyboardEvent('keydown', {
                      key: letter,
                      bubbles: true,
                      cancelable: true,
                    })
                    document.dispatchEvent(keyboardEvent)
                    e.currentTarget.style.opacity = '0.5'
                  }}
                  className="cursor-pointer rounded border px-[25px] text-[60px]"
                  style={{
                    backgroundImage: `url(https://mf.serviceme.lol/cornor-20/kong${randomNumbers[index]}.png)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'black',
                  }}
                >
                  {letter}
                </span>
              )
            })}
          </div>

          <div className="mb-9 w-screen text-center text-sm text-gray-500">
            {shuffled.slice(5).map((letter, index) => {
              return (
                <span
                  key={`${currentWord.name}-${index + 5}`}
                  onClick={(e) => {
                    console.log(letter)
                    const keyboardEvent = new KeyboardEvent('keydown', {
                      key: letter,
                      bubbles: true,
                      cancelable: true,
                    })
                    document.dispatchEvent(keyboardEvent)
                    e.currentTarget.style.opacity = '0.5'
                  }}
                  className="cursor-pointer rounded border px-[25px] text-[60px]"
                  style={{
                    backgroundImage: `url(https://mf.serviceme.lol/cornor-20/kong${randomNumbers[index + 5]}.png)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'black',
                  }}
                >
                  {letter}
                </span>
              )
            })}
          </div>
        </>
      )}

      <Progress className={`mb-10 mt-auto ${state.isTyping ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
