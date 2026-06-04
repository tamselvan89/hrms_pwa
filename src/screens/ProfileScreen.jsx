import { useAuth } from '../context/AuthContext.jsx'

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl px-5 shadow-sm overflow-hidden">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pt-4 pb-1">{title}</p>
      {children}
    </div>
  )
}

export function ProfileScreen({ onBack }) {
  const { profile, logout } = useAuth()
  const fullName = [profile?.firstname, profile?.lastname].filter(Boolean).join(' ')
  const initials = [profile?.firstname?.[0], profile?.lastname?.[0]].filter(Boolean).join('').toUpperCase()

  return (
    <div className="h-screen-safe flex flex-col bg-gray-50">

      {/* Header contains the avatar so nothing gets clipped */}
      <header className="bg-brand-600 pt-safe flex-shrink-0">
        {/* Nav row */}
        <div className="px-4 pt-3 pb-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-lg">My Profile</h1>
        </div>

        {/* Avatar + name — fully inside the header, no overlap tricks */}
        <div className="flex flex-col items-center pb-6 gap-2">
          <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 shadow-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{initials || '?'}</span>
          </div>
          {fullName && (
            <p className="text-white font-bold text-base">{fullName}</p>
          )}
          {profile?.employeeId && (
            <span className="bg-white/20 text-white/90 text-xs font-semibold px-3 py-0.5 rounded-full">
              {profile.employeeId}
            </span>
          )}
        </div>
      </header>

      {/* Scrollable details */}
      <div className="flex-1 scroll-area px-4 pt-4 pb-safe">
        <div className="flex flex-col gap-3 pb-6">
          <Section title="Work Details">
            <Field label="Role"            value={profile?.role?.name} />
            <Field label="Department"      value={profile?.department?.name} />
            <Field label="Designation"     value={profile?.designation?.name} />
            <Field label="Date of Joining" value={profile?.dateOfJoining} />
          </Section>

          <Section title="Contact">
            <Field label="Work Email"     value={profile?.email} />
            <Field label="Mobile"         value={profile?.mobile} />
            <Field label="Personal Email" value={profile?.personalEmail} />
          </Section>

          <button
            onClick={logout}
            className="w-full rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 font-semibold text-sm py-4 flex items-center justify-center gap-2 active:bg-rose-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
