export interface Note {
  id: number;
  position: { x: number; y: number };
  size: { width: number };
  body: string;
  title: string;
  date_created: string;
  color: { title: string; text: string };
  stickify: boolean;
  heart: boolean;
  visible: boolean;
  tags: [id: string, text: string, color: string];
  disableClick: boolean;
}

export interface Tag {
  id: string,
  color: string,
  notes: [number]
}

export interface NoteListProps {
  notes: [Note];
  scrollYOffset: number;
  url: string;
  tags: [Tag];
  onHeartify: (id: number, url: string) => void;
  onStickify: (id: number, url: string) => void;
  onDeleteClick: (id: number, url: string) => void;
  onTextChange: (id: number, body: string, url: string) => void;
  onTitleChange: (id: number, title: string, url: string) => void;
  onPositionChange: (id: number, x: number, y: number, url: string) => void;
  onNoteClicked: (id: number, url: string) => void;
  onColorChange: (id: number, color: string, url: string) => void;
  onSizeChange: (id: number, width: number, url: string) => void;
  onHideNote: (id: number, url: string) => void;
}
