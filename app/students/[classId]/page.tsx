import Link from 'next/link';

// The param name must exactly match your folder name: [classId]
export default function StudentRoster({ params }: { params: { classId: string } }) {
  // We can extract the classId directly from the URL!
  const { classId } = params;

  // Let's make some dummy students for this specific class
  const mockStudents = [
    { id: 'stu-001', name: 'Alice Johnson' },
    { id: 'stu-002', name: 'Bob Smith' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">
        Student Roster for Class: <span className="text-blue-600">{classId}</span>
      </h1>
      
      <div className="flex flex-col gap-2 mt-4">
        {mockStudents.map((student) => (
          // This prepares you for the NEXT step in your structure!
          <Link 
            key={student.id} 
            href={`/students/${classId}/${student.id}`}
            className="p-3 bg-white border rounded hover:border-blue-500 transition"
          >
            {student.name}
          </Link>
        ))}
      </div>
    </div>
  );
}