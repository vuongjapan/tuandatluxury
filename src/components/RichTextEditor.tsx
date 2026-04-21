import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Quote, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolBtn = ({ active, onClick, children, title }: any) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`p-1.5 rounded hover:bg-muted transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange, placeholder }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Nhập nội dung bài viết...' }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[280px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep editor in sync if external value changes (e.g. loaded from DB)
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL liên kết:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('URL ảnh:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5 bg-muted/30">
        <ToolBtn title="Đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn title="Tiêu đề H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Tiêu đề H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn title="Danh sách dấu chấm" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Trích dẫn" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn title="Liên kết" active={editor.isActive('link')} onClick={addLink}><LinkIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Ảnh" onClick={addImage}><ImageIcon className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolBtn title="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Làm lại" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
