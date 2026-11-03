import { describe, expect, mock, test } from 'bun:test'
import { Children, isValidElement } from 'react'

import { LinkRow } from '@/app/[locale]/(panel)/dashboard/links/_components/link-row'

function row(
  draggingId: string | null = 'first',
  dropPosition: number | null = null,
  onPosition = mock((_position: number) => {}),
) {
  return LinkRow({
    link: { id: 'second', title: 'Projeto', url: 'https://example.com', color: '', active: true },
    index: 1,
    total: 3,
    draggingId,
    dropPosition,
    onEdit: mock(),
    onDelete: mock(),
    onMove: mock(),
    onDragStart: mock(),
    onDragEnd: mock(),
    onDragOver: onPosition,
    onDrop: onPosition,
  })
}

describe('link drag feedback', () => {
  test('uses an opaque copy with a fixed cursor anchor and removes it after capture', async () => {
    const element = row()
    const handle = Children.toArray(element.props.children).find(
      (child) => isValidElement<{ draggable?: boolean }>(child) && child.props.draggable,
    )
    if (!isValidElement<{ onDragStart: (event: unknown) => void; onDragEnd: () => void }>(handle))
      throw new Error('Drag handle missing')
    const preview = {
      classList: { remove: mock(), add: mock() },
      style: {},
      setAttribute: mock(),
      remove: mock(),
      inert: false,
    }
    const draggedRow = {
      getBoundingClientRect: () => ({ left: 10, top: 420, width: 900, height: 84 }),
      cloneNode: mock(() => preview),
      parentElement: { appendChild: mock() },
    }
    const dataTransfer = { setData: mock(), setDragImage: mock(), effectAllowed: '' }
    handle.props.onDragStart({
      currentTarget: { closest: () => draggedRow },
      clientX: 30,
      clientY: 50,
      dataTransfer,
    })
    expect(dataTransfer.setDragImage).toHaveBeenCalledWith(preview, 24, 42)
    expect(draggedRow.parentElement.appendChild).toHaveBeenCalledWith(preview)
    expect(preview.classList.remove).toHaveBeenCalledWith('opacity-40')
    expect(preview.style).toMatchObject({ top: '420px', left: '10px', width: '900px' })
    expect(preview.inert).toBe(true)
    expect(dataTransfer.effectAllowed).toBe('move')
    handle.props.onDragEnd()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(preview.remove).toHaveBeenCalledTimes(1)
  })

  test('selects insertion before or after the hovered row and ignores external drags', () => {
    const onPosition = mock((_position: number) => {})
    const element = row('first', null, onPosition)
    const event = {
      preventDefault: mock(),
      dataTransfer: { dropEffect: '' },
      clientY: 25,
      currentTarget: { getBoundingClientRect: () => ({ top: 20, height: 100 }) },
    }
    element.props.onDragOver(event)
    expect(onPosition).toHaveBeenLastCalledWith(1)
    event.clientY = 90
    element.props.onDrop(event)
    expect(onPosition).toHaveBeenLastCalledWith(2)
    expect(event.preventDefault).toHaveBeenCalledTimes(2)
    expect(event.dataTransfer.dropEffect).toBe('move')
    const external = row(null)
    external.props.onDragOver(event)
    expect(event.preventDefault).toHaveBeenCalledTimes(2)
    expect(
      Children.toArray(row('first', 1).props.children).some(
        (child) =>
          isValidElement<{ 'aria-hidden'?: string }>(child) &&
          child.props['aria-hidden'] === 'true',
      ),
    ).toBe(true)
  })
})
