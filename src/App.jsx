import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'student-id-card-data'
const AUTH_STORAGE_KEY = 'school-id-card-auth-accounts'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
})

const readAccountsFromStorage = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function App() {
  const [students, setStudents] = useState(readStudentsFromStorage)
  const [selectedClass, setSelectedClass] = useState('Class 1')
  const [rollNo, setRollNo] = useState('')
  const [newStudent, setNewStudent] = useState(getDefaultStudent())
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authSchoolName, setAuthSchoolName] = useState('')
  const [authSchoolCode, setAuthSchoolCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSchoolProfile, setShowSchoolProfile] = useState(false)
  const [activeSchoolAccount, setActiveSchoolAccount] = useState(null)
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

  const handleActiveSchoolSignatureUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file || !activeSchoolAccount) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const updatedAccount = {
        ...activeSchoolAccount,
        signature: reader.result,
      }

      const existingAccounts = readAccountsFromStorage()
      const updatedAccounts = existingAccounts.map((account) =>
        account.email === updatedAccount.email && account.schoolCode === updatedAccount.schoolCode
          ? updatedAccount
          : account,
      )

      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedAccounts))
      setActiveSchoolAccount(updatedAccount)
      setShowSchoolProfile(false)
      setIsAuthenticated(true)
    }
    reader.readAsDataURL(file)
  }

  const handleAuthSubmit = (event) => {
    event.preventDefault()

    const normalizedEmail = authEmail.trim()
    const normalizedPassword = authPassword.trim()
    const normalizedSchoolCode = authSchoolCode.trim()

    if (!normalizedEmail) {
      setAuthError('Please enter your email address.')
      return
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setAuthError('Please enter a valid email address.')
      return
    }

    if (!normalizedPassword) {
      setAuthError('Please enter your password.')
      return
    }

    if (normalizedPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.')
      return
    }

    if (authMode === 'signup') {
      const normalizedSchoolName = authSchoolName.trim()

      if (!normalizedSchoolName) {
        setAuthError('Please enter the school name.')
        return
      }

      if (!normalizedSchoolCode) {
        setAuthError('Please enter a unique school code.')
        return
      }

      const existingAccounts = readAccountsFromStorage()
      const isExistingAccount = existingAccounts.some((account) => account.email === normalizedEmail)
      const isExistingCode = existingAccounts.some((account) => account.schoolCode === normalizedSchoolCode)

      if (isExistingAccount) {
        setAuthError('This email is already registered. Please login instead.')
        return
      }

      if (isExistingCode) {
        setAuthError('This school code is already in use. Please choose another code.')
        return
      }

      const nextAccount = {
        email: normalizedEmail,
        password: normalizedPassword,
        schoolName: normalizedSchoolName,
        schoolCode: normalizedSchoolCode,
        signature: '',
      }

      const updatedAccounts = [...existingAccounts, nextAccount]
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedAccounts))

      setAuthError('')
      setAuthSuccess('School account created successfully. Please upload the school signature to continue.')
      setActiveSchoolAccount(nextAccount)
      setShowSchoolProfile(true)
      setIsAuthenticated(false)
      return
    }

    if (!normalizedSchoolCode) {
      setAuthError('Please enter your school code.')
      return
    }

    const registeredAccounts = readAccountsFromStorage()
    const matchedAccount = registeredAccounts.find(
      (account) =>
        account.email === normalizedEmail &&
        account.password === normalizedPassword &&
        account.schoolCode === normalizedSchoolCode,
    )

    if (!matchedAccount) {
      setAuthError('Incorrect school code, email, or password. Please sign up first to create an account.')
      return
    }

    setAuthError('')
    setAuthSuccess('')
    setActiveSchoolAccount(matchedAccount)
    setIsAuthenticated(true)
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

  const handlePrintCard = () => {
    if (!selectedStudent) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    const safeName = String(selectedStudent.name || 'Student')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const safeSchoolName = String(activeSchoolAccount?.schoolName || 'Bright Future School')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const safeRollNo = String(selectedStudent.rollNo || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeClassName = String(selectedStudent.className || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const issueDate = new Date().toLocaleDateString('en-GB')
    const photoMarkup = selectedStudent.photo
      ? `<img src="${selectedStudent.photo}" alt="${safeName}" />`
      : '<div class="avatar-placeholder">Photo</div>'
    const signatureMarkup = activeSchoolAccount?.signature
      ? `<img class="signature-preview" src="${activeSchoolAccount.signature}" alt="Signature" />`
      : '<span class="footer-tag">✍ Signature</span>'

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Student ID Card</title>
          <style>
            :root { color-scheme: light only; }
            body {
              margin: 0;
              font-family: Inter, Arial, sans-serif;
              background: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
              box-sizing: border-box;
            }
            .id-card {
              width: 100%;
              max-width: 760px;
              border: 1.5px solid #cbd5e1;
              border-radius: 24px;
              overflow: hidden;
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16);
            }
            .card-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 18px 22px;
              background: linear-gradient(135deg, #0f172a 0%, #0f766e 48%, #2563eb 100%);
              color: white;
            }
            .card-label {
              margin: 0 0 4px;
              font-size: 0.72rem;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              opacity: 0.92;
            }
            .card-top h3 { margin: 0; font-size: 1.2rem; }
            .card-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
            .school-chip, .status-pill {
              display: inline-flex;
              align-items: center;
              border-radius: 999px;
              padding: 6px 10px;
              font-size: 0.78rem;
              font-weight: 700;
            }
            .school-chip { background: rgba(255,255,255,0.16); color: #f8fafc; border: 1px solid rgba(255,255,255,0.2); }
            .status-pill { background: white; color: #2563eb; }
            .card-body { display: flex; gap: 22px; padding: 24px 24px 18px; align-items: flex-start; }
            .avatar-box {
              width: 132px;
              height: 152px;
              border-radius: 18px;
              background: linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%);
              display: grid;
              place-items: center;
              border: 2px solid rgba(15, 118, 110, 0.18);
              color: #475569;
              font-weight: 600;
              overflow: hidden;
              flex-shrink: 0;
            }
            .avatar-box img { width: 100%; height: 100%; object-fit: cover; }
            .avatar-placeholder { font-size: 0.95rem; }
            .info-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
            .info-list h4 { margin: 0 0 4px; font-size: 1.25rem; color: #082f49; }
            .info-list p {
              margin: 0;
              color: #334155;
              font-size: 0.95rem;
              display: flex;
              justify-content: space-between;
              gap: 10px;
              padding: 8px 10px;
              border-radius: 10px;
              background: rgba(248, 250, 252, 0.95);
              border: 1px solid #e2e8f0;
            }
            .info-list strong { color: #0f172a; }
            .card-footer { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px 20px; color: #64748b; border-top: 1px solid rgba(148, 163, 184, 0.22); font-size: 0.92rem; background: linear-gradient(135deg, #fbfdff 0%, #f8fafc 100%); }
            .footer-tag { display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 999px; background: rgba(15, 118, 110, 0.08); color: #0f766e; font-weight: 600; }
            .signature-preview { max-height: 38px; max-width: 120px; object-fit: contain; background: white; padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.25); }
            @media print {
              body { background: white; padding: 0; }
              .id-card { box-shadow: none; border-color: #cbd5e1; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="card-top">
              <div>
                <p class="card-label">Student Identity Card</p>
                <h3>${safeSchoolName}</h3>
              </div>
              <div class="card-top-right">
                <span class="school-chip">Academic Year 2026</span>
                <span class="status-pill">Active</span>
              </div>
            </div>
            <div class="card-body">
              <div class="avatar-box">${photoMarkup}</div>
              <div class="info-list">
                <h4>${safeName}</h4>
                <p><strong>Roll No</strong><span>${safeRollNo}</span></p>
                <p><strong>Class</strong><span>${safeClassName}</span></p>
                <p><strong>Issue Date</strong><span>${issueDate}</span></p>
              </div>
            </div>
            <div class="card-footer">
              <span class="footer-tag">📘 ${safeSchoolName}</span>
              ${signatureMarkup}
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <div className="app-shell">
      {showSchoolProfile ? (
        <div className="auth-shell">
          <div className="auth-card school-profile-card">
            <p className="eyebrow">School Profile</p>
            <h1>{activeSchoolAccount?.schoolName || 'School'}</h1>
            <p className="hero-copy auth-copy">Complete the school profile by uploading the signature image.</p>

            <div className="school-profile-summary">
              <div>
                <span className="summary-label">School Code</span>
                <strong>{activeSchoolAccount?.schoolCode || '—'}</strong>
              </div>
              <div>
                <span className="summary-label">Email</span>
                <strong>{activeSchoolAccount?.email || '—'}</strong>
              </div>
            </div>

            <label className="signature-upload-box profile-upload-box">
              <span>Upload Signature</span>
              <input type="file" accept="image/*" onChange={handleActiveSchoolSignatureUpload} />
            </label>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="auth-shell">
          <div className="auth-card">
            <p className="eyebrow">School Admin Portal</p>
            <h1>Secure Access</h1>
            <p className="hero-copy auth-copy">Only approved school admin credentials can open the student ID card dashboard.</p>

            <div className="auth-mode-switch">
              <button
                type="button"
                className={authMode === 'login' ? 'mode-btn active' : 'mode-btn'}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'mode-btn active' : 'mode-btn'}
                onClick={() => setAuthMode('signup')}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' ? (
                <label>
                  School Name
                  <input
                    type="text"
                    value={authSchoolName}
                    onChange={(event) => setAuthSchoolName(event.target.value)}
                    placeholder="Enter school name"
                  />
                </label>
              ) : null}

              <label>
                School Code
                <input
                  type="text"
                  value={authSchoolCode}
                  onChange={(event) => setAuthSchoolCode(event.target.value)}
                  placeholder={authMode === 'signup' ? 'Create unique code' : 'Enter your school code'}
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="admin@school.edu"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Enter password"
                />
              </label>

              {authError ? <p className="auth-error">{authError}</p> : null}
              {authSuccess ? <p className="auth-success">{authSuccess}</p> : null}

              <button type="submit" className="primary-btn auth-submit">
                {authMode === 'login' ? 'Login to Dashboard' : 'Create School Account'}
              </button>
            </form>

            <p className="auth-note">
              {authMode === 'login'
                ? 'Enter your school code, email, and password to access that school dashboard.'
                : 'Create a unique school code and upload the school signature once during sign-up.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <header className="hero-section">
            <p className="eyebrow">Student ID Card</p>
            <h1>Simple school student ID card system</h1>
            <p className="hero-copy">
              Add students once, choose a class, enter a roll number, and the student card appears instantly.
            </p>
          </header>

          <div className="school-profile-bar">
            <div className="school-profile-meta">
              <p className="eyebrow">Active School</p>
              <h2>{activeSchoolAccount?.schoolName || 'School'}</h2>
              <small>{activeSchoolAccount?.schoolCode || 'School Code'}</small>
            </div>

            <div className="signature-upload-box">
              <span>School Signature</span>
              {activeSchoolAccount?.signature ? (
                <img className="active-signature-preview" src={activeSchoolAccount.signature} alt="School signature" />
              ) : (
                <p className="signature-placeholder">No signature uploaded yet.</p>
              )}
              <input type="file" accept="image/*" onChange={handleActiveSchoolSignatureUpload} />
            </div>
          </div>

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
                    <h3>{activeSchoolAccount?.schoolName || 'Bright Future School'}</h3>
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
                  <span className="footer-tag">📘 {activeSchoolAccount?.schoolName || 'Bright Future School'}</span>
                  {activeSchoolAccount?.signature ? (
                    <img className="signature-preview" src={activeSchoolAccount.signature} alt="Signature" />
                  ) : (
                    <span className="footer-tag">✍ Signature</span>
                  )}
                </div>
              </div>

              <button type="button" className="print-btn" onClick={handlePrintCard}>
                Print / Save Card
              </button>
            </>
          ) : (
            <div className="empty-state">Select a student to see the card.</div>
          )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default App
