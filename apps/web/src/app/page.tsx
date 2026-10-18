const focusAreas = [
  {
    title: 'Companies',
    description: 'Keep employers and contacts in one place.',
  },
  {
    title: 'Applications',
    description: 'Track status, deadlines, and next actions.',
  },
  {
    title: 'Interviews',
    description: 'Prepare for every conversation with context.',
  },
];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="nav">
        <span className="brand">Bewerbungsmanager</span>
        <span className="nav-note">Personal workspace</span>
      </header>

      <section className="hero">
        <p className="eyebrow">One owner. Every device.</p>
        <h1>Bewerbungsmanager</h1>
        <p className="lede">
          Track job applications, interviews, and follow-ups in one private, responsive workspace.
        </p>
      </section>

      <section className="focus" aria-label="Core areas">
        {focusAreas.map((item) => (
          <article className="focus-item" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
