import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt="Luxury cruise ship at sunset"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 hero-gradient"></div>
        
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Exclusive Cruise Experiences
              <br />
              <span className="text-gradient bg-gradient-to-r from-cruise-300 to-cruise-500 bg-clip-text text-transparent">
                For Travel Professionals
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              The world's most exclusive cruise booking platform for verified travel industry professionals. 
              Unlock extraordinary experiences at unbeatable interline rates and discover destinations like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup.html" className="btn btn-primary text-lg px-8 py-4">
                Join Now
              </Link>
              <Link href="#partners" className="btn btn-secondary text-lg px-8 py-4">
                View Partners
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 bg-gray-50">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Our Cruise Line Partners</h2>
            <p className="section-description mx-auto">
              We work with the world's leading cruise lines to bring you 
              exclusive interline rates and extraordinary experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              'Royal Caribbean',
              'Celebrity Cruises', 
              'Princess Cruises',
              'Holland America',
              'Norwegian Cruise Line',
              'MSC Cruises'
            ].map((partner) => (
              <div key={partner} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center">
                <span className="text-gray-700 font-semibold text-center text-sm sm:text-base">
                  {partner}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title">About Interline Asia</h2>
              <p className="section-description">
                Join thousands of travel professionals who trust Interline Asia 
                for exclusive cruise experiences at unbeatable rates.
              </p>
              
              <div className="mt-12 space-y-8">
                {[
                  {
                    icon: '🎯',
                    title: 'Verified Professionals Only',
                    description: 'Exclusive access for verified travel industry professionals'
                  },
                  {
                    icon: '💎',
                    title: 'Premium Experiences',
                    description: 'Luxury cruise experiences at exceptional value'
                  },
                  {
                    icon: '🌏',
                    title: 'Global Network',
                    description: 'Partnerships with leading cruise lines worldwide'
                  }
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-ocean-100 rounded-lg flex items-center justify-center text-2xl">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative h-96 lg:h-full">
              <Image
                src="/images/travel-mood.jpg"
                alt="Travel planning and cruise experiences"
                fill
                className="object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}