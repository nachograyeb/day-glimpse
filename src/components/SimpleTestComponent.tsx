// src/components/SimpleTestComponent.tsx
export const SimpleTestComponent = () => {
  return (
    <div className="p-8">
      <h1 className="text-white text-2xl mb-4">Test Component</h1>

      {/* Test 1: Simple background color */}
      <div className="w-full h-32 bg-purple-500 mb-4 rounded">
        <p className="text-white p-4">Test 1: Simple purple background</p>
      </div>

      {/* Test 2: Gradient background */}
      <div className="w-full h-32 bg-gradient-to-r from-purple-500 to-pink-500 mb-4 rounded">
        <p className="text-white p-4">Test 2: Gradient background</p>
      </div>

      {/* Test 3: Animated background */}
      <div className="w-full h-32 bg-purple-500 animate-pulse mb-4 rounded">
        <p className="text-white p-4">Test 3: Animated background</p>
      </div>

      {/* Test 4: Gradient text */}
      <div className="w-full h-32 bg-gray-800 mb-4 rounded p-4">
        <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Test 4: Gradient Text
        </p>
      </div>
    </div>
  );
};
