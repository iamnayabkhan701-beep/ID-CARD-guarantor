import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'student-id-card-data'

const readStudentsFromStorage = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const classOptions = [
  'Play Group',
  'Nursery',
  'Prep',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
]

const getDefaultStudent = () => ({
  name: '',
  rollNo: '',
  className: 'Class 1',
  photo: '',
  signature: '',
})

function App() {
  const [students, setStudents] = useState(readStudentsFromStorage)
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [rollNo, setRollNo] = useState('')
  const [newStudent, setNewStudent] = useState(getDefaultStudent())
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [editingStudent, setEditingStudent] = useState(getDefaultStudent())

  const availableClasses = useMemo(() => {
    const fromStudents = [...new Set(students.map((student) => student.className))]
    return [...new Set([...classOptions, ...fromStudents])]
  }, [students])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  }, [students])

  const classStudents = useMemo(() => {
    return students.filter((student) => student.className === selectedClass)
  }, [selectedClass, students])

  const handleClassChange = (event) => {
    const nextClass = event.target.value
    setSelectedClass(nextClass)

    const nextClassStudents = students.filter((student) => student.className === nextClass)
    const matchingStudent = nextClassStudents.find((student) => student.rollNo === rollNo) || nextClassStudents[0] || null

    setSelectedStudent(matchingStudent)
    setRollNo(matchingStudent?.rollNo || '')
  }

  const handleRollChange = (event) => {
    const value = event.target.value
    setRollNo(value)

    const matchedStudent = classStudents.find((student) => student.rollNo === value) || null
    setSelectedStudent(matchedStudent)
  }

  const handleNewStudentChange = (event) => {
    const { name, value } = event.target
    setNewStudent((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (event, field) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setNewStudent((prev) => ({ ...prev, [field]: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleAddStudent = (event) => {
    event.preventDefault()

    if (!newStudent.name || !newStudent.rollNo) return

    const studentToAdd = {
      id: Date.now(),
      name: newStudent.name.trim(),
      rollNo: newStudent.rollNo.trim(),
      className: newStudent.className,
      photo: newStudent.photo,
      signature: newStudent.signature,
    }

    const updatedStudents = [...students, studentToAdd]
    setStudents(updatedStudents)
    setSelectedClass(studentToAdd.className)
    setRollNo(studentToAdd.rollNo)
    setSelectedStudent(studentToAdd)
    setNewStudent(getDefaultStudent())
  }

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setRollNo(student.rollNo)
  }

  const handleEditStudent = (student) => {
    setEditingStudentId(student.id)
    setEditingStudent({
      name: student.name,
      rollNo: student.rollNo,
      className: student.className,
      photo: student.photo || '',
      signature: student.signature || '',
    })
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditingStudent((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditImageUpload = (event, field) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setEditingStudent((prev) => ({ ...prev, [field]: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveEdit = (studentId) => {
    if (!editingStudent.name || !editingStudent.rollNo) return

    const updatedStudents = students.map((student) =>
      student.id === studentId
        ? {
            ...student,
            name: editingStudent.name.trim(),
            rollNo: editingStudent.rollNo.trim(),
            className: editingStudent.className,
            photo: editingStudent.photo,
            signature: editingStudent.signature,
          }
        : student,
    )

    setStudents(updatedStudents)
    setEditingStudentId(null)
    setEditingStudent(getDefaultStudent())
  }

  const handleDeleteStudent = (studentId) => {
    const updatedStudents = students.filter((student) => student.id !== studentId)
    setStudents(updatedStudents)

    if (selectedStudent?.id === studentId) {
      const nextStudent = updatedStudents.find((student) => student.className === selectedClass) || null
      setSelectedStudent(nextStudent)
      setRollNo(nextStudent?.rollNo || '')
    }

    if (editingStudentId === studentId) {
      setEditingStudentId(null)
      setEditingStudent(getDefaultStudent())
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-section">
        <p className="eyebrow">Student ID Card</p>
        <h1>Simple school student ID card system</h1>
        <p className="hero-copy">
          Add students once, choose a class, enter a roll number, and the student card appears instantly.
        </p>
      </header>

      <div className="content-grid">
        <section className="form-card" aria-label="student setup form">
          <div className="section-head">
            <div className="section-title-row">
              <h2>Add Student</h2>
              <span className="panel-pill">Input Layer</span>
            </div>
            <p>Enter details and save them in one step.</p>
          </div>
          <form onSubmit={handleAddStudent} className="student-form">
            <label>
              Student Name
              <input type="text" name="name" value={newStudent.name} onChange={handleNewStudentChange} placeholder="Enter full name" />
            </label>

            <label>
              Roll Number
              <input type="text" name="rollNo" value={newStudent.rollNo} onChange={handleNewStudentChange} placeholder="e.g. 101" />
            </label>

            <label>
              Class
              <select name="className" value={newStudent.className} onChange={handleNewStudentChange}>
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Student Photo
              <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'photo')} />
            </label>

            <label>
              Signature
              <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'signature')} />
            </label>

            <button type="submit" className="primary-btn">Add Student</button>
          </form>

          <div className="search-block">
            <label>
              Select Class
              <select value={selectedClass} onChange={handleClassChange}>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Enter Roll Number
              <input type="text" value={rollNo} onChange={handleRollChange} placeholder="Search by roll number" />
            </label>
          </div>

          <div className="student-list">
            <h3>Students in {selectedClass}</h3>
            {classStudents.length ? (
              classStudents.map((student) => (
                <div key={student.id} className={selectedStudent?.id === student.id ? 'student-item active' : 'student-item'}>
                  <button type="button" className="student-main-btn" onClick={() => handleStudentSelect(student)}>
                    <span>{student.name}</span>
                    <small>Roll {student.rollNo}</small>
                  </button>

                  <div className="student-actions">
                    <button type="button" className="mini-btn" onClick={() => handleEditStudent(student)}>
                      Edit
                    </button>
                    <button type="button" className="mini-btn danger" onClick={() => handleDeleteStudent(student.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">No students found in this class.</p>
            )}
          </div>
        </section>

        <section className="preview-card" aria-label="student ID card preview">
          <div className="section-head">
            <div className="section-title-row">
              <h2>Student Card Preview</h2>
              <span className="panel-pill">Preview Layer</span>
            </div>
            <p>Preview the final ID card instantly.</p>
          </div>
          {editingStudentId ? (
            <div className="edit-panel">
              <h3>Edit Student</h3>
              <label>
                Name
                <input type="text" name="name" value={editingStudent.name} onChange={handleEditChange} />
              </label>
              <label>
                Roll Number
                <input type="text" name="rollNo" value={editingStudent.rollNo} onChange={handleEditChange} />
              </label>
              <label>
                Class
                <select name="className" value={editingStudent.className} onChange={handleEditChange}>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Photo
                <input type="file" accept="image/*" onChange={(event) => handleEditImageUpload(event, 'photo')} />
              </label>
              <label>
                Signature
                <input type="file" accept="image/*" onChange={(event) => handleEditImageUpload(event, 'signature')} />
              </label>
              <button type="button" className="primary-btn" onClick={() => handleSaveEdit(editingStudentId)}>
                Save Changes
              </button>
            </div>
          ) : null}
          {selectedStudent ? (
            <>
              <div className="id-card">
                <div className="card-top">
                  <div>
                    <p className="card-label">Student Identity Card</p>
                    <h3>Bright Future School</h3>
                  </div>
                  <div className="card-top-right">
                    <span className="school-chip">Academic Year 2026</span>
                    <span className="status-pill">Active</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="avatar-box">
                    {selectedStudent.photo ? <img src={selectedStudent.photo} alt={selectedStudent.name} /> : 'Photo'}
                  </div>

                  <div className="info-list">
                    <h4>{selectedStudent.name}</h4>
                    <p><strong>Roll No</strong><span>{selectedStudent.rollNo}</span></p>
                    <p><strong>Class</strong><span>{selectedStudent.className}</span></p>
                    <p><strong>Issue Date</strong><span>{new Date().toLocaleDateString('en-GB')}</span></p>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="footer-tag">📘 Bright Future School</span>
                  {selectedStudent.signature ? <img className="signature-preview" src={selectedStudent.signature} alt="Signature" /> : <span className="footer-tag">✍ Signature</span>}
                </div>
              </div>

              <button type="button" className="print-btn" onClick={() => window.print()}>
                Print / Save Card
              </button>
            </>
          ) : (
            <div className="empty-state">Select a student to see the card.</div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
