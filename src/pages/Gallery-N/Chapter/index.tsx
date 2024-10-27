import { useChapterStats } from '../hooks/useChapterStats'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { useEffect, useRef } from 'react'
import IconCheckCircle from '~icons/heroicons/check-circle-solid'

export default function Chapter({
  index,
  checked,
  dictID,
  onChange,
}: {
  index: number
  checked: boolean
  dictID: string
  onChange: (index: number) => void
}) {
  const ref = useRef<HTMLTableRowElement>(null)

  const entry = useIntersectionObserver(ref, {})
  const isVisible = !!entry?.isIntersecting
  const chapterStatus = useChapterStats(index, dictID, isVisible)

  useEffect(() => {
    if (checked && ref.current !== null) {
      const button = ref.current
      const container = button.parentElement?.parentElement?.parentElement
      container?.scroll({
        top: button.offsetTop - container.offsetTop - 300,
        behavior: 'smooth',
      })
    }
  }, [checked])

  return (
    <div
      ref={ref}
      className="relative flex h-8 w-20 min-w-[5rem] cursor-pointer flex-col items-start
                 justify-center overflow-hidden 
                 rounded-lg bg-slate-100 px-1 py-0.5 dark:bg-slate-800
                 sm:h-10 sm:w-24 sm:min-w-[6rem] sm:px-1.5 sm:py-0.5
                 md:h-12 md:w-28 md:min-w-[7rem] md:px-2 md:py-1
                 lg:h-14 lg:w-32 lg:min-w-[8rem] lg:px-2.5 lg:py-1.5
                 xl:h-16 xl:w-36 xl:min-w-[9rem] xl:px-3 xl:py-2"
      onClick={() => onChange(index)}
    >
      <h1 className="text-3xs sm:text-2xs md:text-xs lg:text-sm xl:text-base">第 {index + 1} 章</h1>
      <p className="pt-[1px] text-[6px] text-slate-600 sm:text-[8px] md:text-[10px] lg:text-xs xl:text-sm">
        {chapterStatus ? (chapterStatus.exerciseCount > 0 ? `练习 ${chapterStatus.exerciseCount} 次` : '未练习') : '加载中...'}
      </p>
      {checked && (
        <IconCheckCircle
          className="absolute -bottom-1 -right-1 h-6 w-6 text-xl
                     text-green-500 opacity-40 dark:text-green-300 
                     sm:-bottom-1.5 sm:-right-1.5 sm:h-8 sm:w-8 sm:text-2xl
                     md:-bottom-2 md:-right-2 md:h-10 md:w-10 md:text-3xl
                     lg:-bottom-2.5 lg:-right-2.5 lg:h-12 lg:w-12 lg:text-4xl
                     xl:-bottom-3 xl:-right-3 xl:h-14 xl:w-14 xl:text-5xl"
        />
      )}
    </div>
  )
}
