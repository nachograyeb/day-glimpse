export default function TestPage() {
  return (
    <div className="min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl">Debug Test</h1>

        {/* Test 1: Basic Tailwind class */}
        <div className="bg-red-500 text-white p-4 my-4">
          If this has a red background, basic Tailwind is working
        </div>

        {/* Test 2: Gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 my-4">
          If this has a gradient, gradients are working
        </div>

        {/* Test 3: Inline style for comparison */}
        <div style={{ backgroundColor: 'green', color: 'white', padding: '1rem', marginTop: '1rem' }}>
          This has inline styles as a reference
        </div>
      </div>
    </div>
  );
}
