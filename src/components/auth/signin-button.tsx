"use client"

export function SigninButton({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode
  text: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 py-3 rounded-xl 
                 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 
                 font-medium text-gray-700 dark:text-gray-200 
                 transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md"
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}