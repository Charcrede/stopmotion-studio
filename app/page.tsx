import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#141414] text-white font-poppins">
      {/* HERO */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-blanka leading-tight">
          Crée du stop motion
          <br />
          <span className="text-[#4F46E5]">directement dans ton navigateur</span>
        </h1>

        <p className="max-w-2xl text-gray-400 text-base sm:text-lg">
          Capture image par image,
          <br />
          ajuste tes mouvements avec l’onion skin,
          <br />
          et exporte ton animation en vidéo,
          <br />
          sans logiciel lourd ni installation.
        </p>

        <div className="flex gap-4 mt-4 flex-wrap justify-center">
          <Link
            href="/studio"
            className="px-6 py-3 rounded-xl bg-[#4F46E5] text-white font-semibold hover:scale-105 transition-transform"
          >
            Démarrer une animation
          </Link>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-blanka text-center mb-10">
          Le principe
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            "Capture",
            "Ajustement",
            "Animation",
            "Export",
          ].map((title, i) => (
            <div
              key={i}
              className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black"
            >
              <img src="/bg.png" alt="preview" />
              <div className="absolute inset-0 p-4 flex flex-col justify-center text-center bg-black/40">
                <h3 className="font-blanka text-xl mb-2">{title}</h3>
                <p className="font-edusa text-sm text-gray-200">
                  Une étape simple et directe,
                  pensée pour rester concentré sur le mouvement.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-blanka mb-6">
          Pourquoi ce projet ?
        </h2>

        <p className="text-gray-400 leading-relaxed text-base sm:text-lg">
          Le stop motion est une discipline exigeante,
          <br />
          mais les outils existants sont souvent
          <br />
          lourds, complexes ou payants.
          <br />
          <br />
          L’objectif ici est simple :
          <br />
          <span className="text-white font-semibold">
            proposer un outil minimal, clair et accessible,
          </span>
          <br />
          qui laisse toute la place à la créativité,
          <br />
          sans friction technique.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-blanka text-center mb-12">
          Comment ça marche
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StepCard
            title="Capture"
            description="Prends des images une par une directement depuis la caméra."
          />
          <StepCard
            title="Précision"
            description="Utilise l’onion skin pour ajuster chaque mouvement."
          />
          <StepCard
            title="Export"
            description="Exporte ton animation finale en vidéo."
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-blanka mb-6">
          Le mouvement,
          <br />
          image par image.
        </h2>

        <Link
          href="/studio"
          className="inline-block mt-4 px-8 py-4 rounded-2xl bg-[#4F46E5] text-white font-semibold hover:scale-105 transition-transform"
        >
          Créer une animation
        </Link>
      </section>
    </main>
  );
}

function StepCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all">
      <h3 className="font-blanka text-xl mb-3 text-[#4F46E5]">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
