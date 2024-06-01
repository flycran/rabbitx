import classNames from 'classnames'
import React, { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'

export interface SidebarProps {
  className?: string
  style?: CSSProperties
  width?: number
  max?: number
  min?: number
  children: ReactNode
  safeDistance?: number
}

const SlideSidebar = ({
  width: w = 100,
  max = Infinity,
  min = 10,
  safeDistance = 10,
  style,
  className,
  children,
}: SidebarProps) => {
  const [width, setWidth] = useState(w)
  const resizing = useRef(false)
  const initialX = useRef(0)
  const initialWidth = useRef(0)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [parentWidth, setParentWidth] = useState(0)

  useEffect(() => {
    const sidebarElement = sidebarRef.current!

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) {
        return
      }

      const newParentWidth = entries[0].contentRect.width
      setParentWidth(newParentWidth)
    })

    resizeObserver.observe(sidebarElement.parentElement!)

    return () => {
      resizeObserver.unobserve(sidebarElement.parentElement!)
    }
  }, [width, safeDistance])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const movementX = e.clientX - initialX.current
      const newWidth = initialWidth.current + movementX

      setWidth(Math.max(min, Math.min(max, newWidth)))
    }

    const handleMouseUp = () => {
      resizing.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [min, max])

  const handleMouseDown = (e: React.MouseEvent) => {
    resizing.current = true
    initialX.current = e.clientX
    initialWidth.current = sidebarRef.current!.offsetWidth
  }

  const safeWidth = Math.max(min, Math.min(width, parentWidth - safeDistance))

  return (
    <div
      style={{
        ...style,
        height: '100%',
        width: safeWidth,
      }}
      ref={sidebarRef}
      className={classNames('sidebar', className)}
    >
      {children}
      <div className="sidebar-handle" onMouseDown={handleMouseDown} />
    </div>
  )
}

export default SlideSidebar
