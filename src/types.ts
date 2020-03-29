export interface Note {
  id: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  body: string;
  title: string;
  date_created: string;
  color: { title: string; text: string };
  stickify: boolean;
  heart: boolean;
}

export interface NoteListProps {
  notes: [Note];
  scrollYOffset: number;
  onHeartify: (id: number) => void;
  onStickify: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onTextChange: (id: number, body: string, title: string) => void;
  onTitleChange: (id: number, title: string) => void;
  onPositionChange: (id: number, x: number, y: number) => void;
  onNoteClicked: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
  onSizeChange: (id: number, width: number, height: number) => void;
}
