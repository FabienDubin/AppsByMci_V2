'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'
import { Bold, Italic, Link as LinkIcon, Code, Undo, Redo, Heading1, Heading2, Heading3, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onInsertVariable?: (insertFn: (variable: string) => void) => void
}

/**
 * Rich Text Editor using Tiptap
 * Supports: Bold, Italic, Links, HTML source mode
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écris ton email ici...',
  className,
  disabled = false,
  onInsertVariable,
}: RichTextEditorProps) {
  const [showSourceDialog, setShowSourceDialog] = useState(false)
  const [sourceHtml, setSourceHtml] = useState('')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        codeBlock: false,
        blockquote: false,
        // Enable headings H1, H2, H3 for text hierarchy (Story 3.13)
        heading: {
          levels: [1, 2, 3],
        },
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        link: false, // Disable default link to use our custom config
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none',
          '[&_p]:my-2 [&_a]:text-primary [&_a]:underline',
          // Heading styles (Story 3.13)
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3',
          '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2',
          '[&_h3]:text-lg [&_h3]:font-medium [&_h3]:my-2'
        ),
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Expose insert function to parent component
  useEffect(() => {
    if (editor && onInsertVariable) {
      const insertFn = (variable: string) => {
        editor.chain().focus().insertContent(variable).run()
      }
      onInsertVariable(insertFn)
    }
  }, [editor, onInsertVariable])

  // Open source dialog with current HTML
  const handleOpenSource = () => {
    if (editor) {
      setSourceHtml(editor.getHTML())
      setShowSourceDialog(true)
    }
  }

  // Apply source HTML changes
  const handleApplySource = () => {
    if (editor) {
      editor.commands.setContent(sourceHtml)
      onChange(sourceHtml)
    }
    setShowSourceDialog(false)
  }

  // Handle link insertion
  const handleAddLink = () => {
    if (editor && linkUrl) {
      // Check if there's selected text
      const { from, to } = editor.state.selection
      if (from === to) {
        // No selection, insert link with URL as text
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkUrl}</a>`)
          .run()
      } else {
        // Selection exists, wrap it in link
        editor.chain().focus().setLink({ href: linkUrl }).run()
      }
    }
    setLinkUrl('')
    setShowLinkDialog(false)
  }

  // Remove link
  const handleRemoveLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        {/* Heading buttons - Story 3.13 */}
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          aria-label="Titre 1"
          title="Titre 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          aria-label="Titre 2"
          title="Titre 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          aria-label="Titre 3"
          title="Titre 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('paragraph')}
          onPressedChange={() => editor.chain().focus().setParagraph().run()}
          disabled={disabled}
          aria-label="Texte normal"
          title="Texte normal"
        >
          <Type className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Gras"
          title="Gras"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italique"
          title="Italique"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('link')}
          onPressedChange={() => {
            if (editor.isActive('link')) {
              handleRemoveLink()
            } else {
              setShowLinkDialog(true)
            }
          }}
          disabled={disabled}
          aria-label="Lien"
          title="Lien"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Annuler"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Refaire"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenSource}
          disabled={disabled}
          className="gap-1.5"
          title="Éditer HTML"
        >
          <Code className="h-4 w-4" />
          <span className="text-xs">HTML</span>
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[200px] bg-background',
          // Placeholder styling via Tiptap extension
          '[&_.tiptap.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.tiptap.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.tiptap.is-editor-empty:first-child::before]:float-left',
          '[&_.tiptap.is-editor-empty:first-child::before]:h-0',
          '[&_.tiptap.is-editor-empty:first-child::before]:pointer-events-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un lien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddLink()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddLink} disabled={!linkUrl}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Source HTML Dialog */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Éditer le HTML source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={sourceHtml}
              onChange={(e) => setSourceHtml(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              placeholder="<p>Ton HTML ici...</p>"
            />
            <p className="text-xs text-muted-foreground">
              Tu peux éditer directement le HTML. Les modifications seront appliquées à l&apos;éditeur.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSourceDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleApplySource}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
