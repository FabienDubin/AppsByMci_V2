import Link from 'next/link'

/**
 * 404 page for animation not found
 * Displayed when animation doesn't exist or is not published
 */
export default function AnimationNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Animation introuvable
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          L&apos;animation demandée n&apos;existe pas ou n&apos;est plus disponible.
        </p>

        {/* Action */}
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
