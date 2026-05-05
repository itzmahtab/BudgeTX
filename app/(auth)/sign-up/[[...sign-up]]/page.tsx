import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <SignUp 
      signInUrl="/sign-in"
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "w-full shadow-none border border-gray-200",
        }
      }}
    />
  )
}
