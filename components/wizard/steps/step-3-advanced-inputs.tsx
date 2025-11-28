'use client'

import { useState, useMemo } from 'react'
import { useWizardStore, InputElement } from '@/lib/stores/wizard.store'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Plus, AlertCircle } from 'lucide-react'
import { AddElementModal } from '../add-element-modal'
import { ElementBlock } from '../element-block'
import { DeleteElementDialog } from '../delete-element-dialog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable wrapper component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {typeof children === 'function'
        ? children({ dragHandleProps: { ...attributes, ...listeners }, isDragging })
        : children}
    </div>
  )
}

export function Step3AdvancedInputs() {
  const { animationData, updateData } = useWizardStore()
  const [elements, setElements] = useState<InputElement[]>(
    animationData.inputCollection?.elements || []
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingElement, setEditingElement] = useState<InputElement | null>(null)
  const [deletingElementId, setDeletingElementId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Check if selfie already exists
  const hasSelfie = useMemo(() => {
    return elements.some((el) => el.type === 'selfie')
  }, [elements])

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)

        // Recalculate order
        const withNewOrder = reordered.map((item, index) => ({
          ...item,
          order: index,
        }))

        // Update store asynchronously to avoid setState during render
        queueMicrotask(() => {
          updateData({
            inputCollection: {
              elements: withNewOrder,
            },
          })
        })

        return withNewOrder
      })
    }
  }

  // Handle add element
  const handleAddElement = (elementData: Omit<InputElement, 'id' | 'order'>) => {
    const newElement: InputElement = {
      ...elementData,
      id: crypto.randomUUID(),
      order: elements.length,
    } as InputElement

    const updatedElements = [...elements, newElement]
    setElements(updatedElements)
    updateData({
      inputCollection: {
        elements: updatedElements,
      },
    })
    setValidationError(null)
  }

  // Handle edit element
  const handleEditElement = (element: InputElement) => {
    setEditingElement(element)
    setIsModalOpen(true)
  }

  // Handle save edited element
  const handleSaveEdit = (elementData: Omit<InputElement, 'id' | 'order'>) => {
    if (!editingElement) return

    const updatedElements = elements.map((el) =>
      el.id === editingElement.id
        ? { ...elementData, id: el.id, order: el.order } as InputElement
        : el
    )

    setElements(updatedElements)
    updateData({
      inputCollection: {
        elements: updatedElements,
      },
    })
    setEditingElement(null)
  }

  // Handle delete element
  const handleDeleteElement = (elementId: string) => {
    setDeletingElementId(elementId)
    setIsDeleteDialogOpen(true)
  }

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deletingElementId) return

    const updatedElements = elements
      .filter((el) => el.id !== deletingElementId)
      .map((el, index) => ({ ...el, order: index }))

    setElements(updatedElements)
    updateData({
      inputCollection: {
        elements: updatedElements,
      },
    })
    setDeletingElementId(null)
  }

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingElement(null)
    setIsModalOpen(true)
  }

  const deletingElement = elements.find((el) => el.id === deletingElementId)

  return (
    <div className="space-y-6">
      {/* Help Text */}
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Ces éléments seront présentés aux participants sous forme de wizard (un élément = un
          écran). L'ordre défini ici détermine l'ordre des écrans.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Exemple :</strong> Écran 1 (champs de base) → Écran 2 (Selfie) → Écran 3
          (Question 1) → Écran 4 (Question 2) → Soumission.
        </p>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Elements List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Éléments de collecte</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOpenAddModal}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un élément
            </Button>
            <Button
              variant="outline"
              disabled
              className="gap-2 opacity-50 cursor-not-allowed"
              title="Disponible dans la prochaine version"
            >
              <Sparkles className="h-4 w-4" />
              Générer avec IA
            </Button>
          </div>
        </div>

        {/* Elements or Empty State */}
        {elements.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Aucun élément ajouté. Cliquez sur "+ Ajouter un élément" pour commencer.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={elements.map((el) => el.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {elements.map((element) => (
                  <SortableItem key={element.id} id={element.id}>
                    {({ dragHandleProps, isDragging }: any) => (
                      <ElementBlock
                        element={element}
                        onEdit={handleEditElement}
                        onDelete={handleDeleteElement}
                        dragHandleProps={dragHandleProps}
                        isDragging={isDragging}
                      />
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddElementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingElement(null)
        }}
        onSave={editingElement ? handleSaveEdit : handleAddElement}
        existingElement={editingElement}
        hasSelfie={hasSelfie}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteElementDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingElementId(null)
        }}
        onConfirm={handleConfirmDelete}
        elementType={deletingElement?.type || null}
      />
    </div>
  )
}
