// components/ui/card.jsx

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`flex flex-col justify-between space-y-4 ${className}`}>
      {children}
    </div>
  );
}
