'use client';

interface Note {
  id: string;
  date: string;
  teacher: string;
  content: string;
}

interface TeachersNotesProps {
  notes: Note[];
}

export default function TeachersNotes({ notes }: TeachersNotesProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Teachers Notes</h2>

      <div className="space-y-6">
        {notes.map((note, index) => (
          <div key={note.id} className={index !== notes.length - 1 ? 'pb-6 border-b border-gray-200' : ''}>
            {/* Date Header */}
            <p className="text-sm font-semibold text-gray-900 mb-2">{note.date}</p>

            {/* Teacher Name */}
            <p className="text-sm text-gray-500 mb-3">{note.teacher}</p>

            {/* Note Content */}
            <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
