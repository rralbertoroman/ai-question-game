interface Requirement {
  label: string;
  met: boolean;
}

interface Props {
  requirements: Requirement[];
}

export default function PasswordRequirements({ requirements }: Props) {
  return (
    <ul className="mt-2 space-y-1">
      {requirements.map((req) => (
        <li key={req.label} className="flex items-center gap-2 text-xs">
          {req.met ? (
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={req.met ? 'text-green-400' : 'text-gray-500'}>{req.label}</span>
        </li>
      ))}
    </ul>
  );
}
