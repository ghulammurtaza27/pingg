export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
            Stop Missing Important Emails
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-[800px]">
            Ping filters emails based on your knowledge base. Only see what matters.
          </p>
        </div>
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0V0zm1 1v38h38V1H1z' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      />
    </section>
  )
} 