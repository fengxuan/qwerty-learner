import { useDeleteWordRecord } from '../../../utils/db'
import Chapter from '../Chapter'
import { ErrorTable } from '../ErrorTable'
import { getRowsFromErrorWordData } from '../ErrorTable/columns'
import { ReviewDetail } from '../ReviewDetail'
import useErrorWordData from '../hooks/useErrorWords'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { currentChapterAtom, currentDictIdAtom, reviewModeInfoAtom } from '@/store'
import type { Dictionary } from '@/typings'
import range from '@/utils/range'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IcOutlineCollectionsBookmark from '~icons/ic/outline-collections-bookmark'
import MajesticonsPaperFoldTextLine from '~icons/majesticons/paper-fold-text-line'
import PajamasReviewList from '~icons/pajamas/review-list'

enum Tab {
  Chapters = 'chapters',
  Errors = 'errors',
  Review = 'review',
}

export default function DictDetail({ dictionary: dict }: { dictionary: Dictionary }) {
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const [currentDictId, setCurrentDictId] = useAtom(currentDictIdAtom)
  const [curTab, setCurTab] = useState<Tab>(Tab.Chapters)
  const setReviewModeInfo = useSetAtom(reviewModeInfoAtom)
  const navigate = useNavigate()
  const { deleteWordRecord } = useDeleteWordRecord()
  const [reload, setReload] = useState(false)

  const chapter = useMemo(() => (dict.id === currentDictId ? currentChapter : 0), [currentChapter, currentDictId, dict.id])
  const { errorWordData, isLoading, error } = useErrorWordData(dict, reload)

  const tableData = useMemo(() => {
    return getRowsFromErrorWordData(errorWordData)
  }, [errorWordData])

  const onDelete = useCallback(
    async (word: string) => {
      await deleteWordRecord(word, dict.id)
      setReload((old) => !old)
    },
    [deleteWordRecord, dict.id],
  )

  const onChangeChapter = useCallback(
    (index: number) => {
      setCurrentDictId(dict.id)
      setCurrentChapter(index)
      setReviewModeInfo((old) => ({ ...old, isReviewMode: false }))
      navigate('/')
    },
    [dict.id, navigate, setCurrentChapter, setCurrentDictId, setReviewModeInfo],
  )

  const handleTabChange = useCallback(
    (value: Tab) => {
      if (value !== curTab) {
        setCurTab(value)
      }
    },
    [curTab],
  )

  return (
    <div className="xl:rounded-4xl flex flex-col rounded-lg px-2 py-2 pl-3 text-gray-800 dark:text-gray-300 sm:rounded-xl sm:px-3 sm:py-3 sm:pl-4 md:rounded-2xl md:px-4 md:pl-5 lg:rounded-3xl lg:px-5 lg:py-4 lg:pl-6 xl:px-6 xl:py-5 xl:pl-7">
      <div className="text relative flex min-h-[6rem] flex-col gap-1 sm:min-h-[8rem] sm:gap-2 md:min-h-[10rem] lg:min-h-[12rem] xl:min-h-[14rem]">
        <h3 className="text-base font-semibold sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">{dict.name}</h3>
        <p className="mt-0.5 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{dict.chapterCount} 章节</p>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">共 {dict.length} 词</p>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{dict.description}</p>
        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-3 md:right-3 lg:bottom-4 lg:right-4 xl:bottom-5 xl:right-5">
          <ToggleGroup type="single" value={curTab} onValueChange={handleTabChange}>
            <ToggleGroupItem
              value={Tab.Chapters}
              disabled={curTab === Tab.Chapters}
              className={`${
                curTab === Tab.Chapters ? 'text-primary-foreground bg-primary' : ''
              } text-[8px] disabled:opacity-100 sm:text-[10px] md:text-xs lg:text-sm xl:text-base`}
            >
              <MajesticonsPaperFoldTextLine className="mr-0.5 text-gray-500 sm:mr-1 md:mr-1.5 lg:mr-2 xl:mr-2.5" />
              章节选择
            </ToggleGroupItem>
            {errorWordData.length > 0 && (
              <>
                <ToggleGroupItem
                  value={Tab.Errors}
                  disabled={curTab === Tab.Errors}
                  className={`${
                    curTab === Tab.Errors ? 'text-primary-foreground bg-primary' : ''
                  } text-[8px] disabled:opacity-100 sm:text-[10px] md:text-xs lg:text-sm xl:text-base`}
                >
                  <IcOutlineCollectionsBookmark className="mr-0.5 text-gray-500 sm:mr-1 md:mr-1.5 lg:mr-2 xl:mr-2.5" />
                  查看错题
                </ToggleGroupItem>
                <ToggleGroupItem
                  value={Tab.Review}
                  disabled={curTab === Tab.Review}
                  className={`${
                    curTab === Tab.Review ? 'text-primary-foreground bg-primary' : ''
                  } text-[8px] disabled:opacity-100 sm:text-[10px] md:text-xs lg:text-sm xl:text-base`}
                >
                  <PajamasReviewList className="mr-0.5 text-gray-500 sm:mr-1 md:mr-1.5 lg:mr-2 xl:mr-2.5" />
                  错题回顾
                </ToggleGroupItem>
              </>
            )}
          </ToggleGroup>
        </div>
      </div>
      <div className="flex pl-0">
        <Tabs
          value={curTab}
          className="h-[calc(100vh-14rem)] w-full sm:h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)] lg:h-[calc(100vh-20rem)] xl:h-[calc(100vh-22rem)]"
        >
          <TabsContent value={Tab.Chapters} className="h-full">
            <ScrollArea className="h-full">
              <div className="flex w-full flex-wrap gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3">
                {range(0, dict.chapterCount, 1).map((index) => (
                  <Chapter
                    key={`${dict.id}-${index}`}
                    index={index}
                    checked={chapter === index}
                    dictID={dict.id}
                    onChange={onChangeChapter}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value={Tab.Errors} className="h-full">
            <ErrorTable data={tableData} isLoading={isLoading} error={error} onDelete={onDelete} />
          </TabsContent>
          <TabsContent value={Tab.Review} className="h-full">
            <ReviewDetail errorData={errorWordData} dict={dict} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
