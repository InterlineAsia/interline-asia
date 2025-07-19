import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-ocean-50 to-ocean-100">
        <div className="section-container">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 font-display">
              About Interline Asia
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-ocean-500 to-cruise-500 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 leading-relaxed">
              Welcome to Interline Asia — where verified travel professionals access luxury cruise deals at exceptional value. 
              We connect industry insiders with exclusive interline rates across premium cruise lines. Our mission is to 
              simplify access, elevate experience, and support the travel trade community throughout Asia-Pacific.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                To provide verified travel industry professionals with exclusive access to luxury cruise experiences 
                at unbeatable interline rates, while fostering a community of travel experts across the Asia-Pacific region.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: 'Industry Expertise',
                    description: 'Deep understanding of travel industry needs and challenges'
                  },
                  {
                    title: 'Exclusive Access',
                    description: 'Verified professionals-only platform with premium benefits'
                  },
                  {
                    title: 'Regional Focus',
                    description: 'Specialized knowledge of Asia-Pacific cruise markets'
                  }
                ].map((item) => (
                  <div key={item.title} className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-ocean-500 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative h-96">
              <Image
                src="/images/travel-mood.jpg"
                alt="Professional travel planning"
                fill
                className="object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Our Values</h2>
            <p className="section-description mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Excellence',
                description: 'We strive for excellence in every cruise experience and service interaction'
              },
              {
                icon: '🤝',
                title: 'Trust',
                description: 'Building lasting relationships through transparency and reliability'
              },
              {
                icon: '🌟',
                title: 'Innovation',
                description: 'Continuously improving our platform and services for better experiences'
              },
              {
                icon: '🌏',
                title: 'Community',
                description: 'Supporting and connecting travel professionals across Asia-Pacific'
              }
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Why Choose Interline Asia?</h2>
            <p className="section-description mx-auto">
              Discover what makes us the preferred choice for travel professionals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                title: 'Verified Professional Network',
                description: 'Join thousands of verified travel industry professionals who trust our platform for exclusive cruise experiences.',
                features: ['Industry verification required', 'Professional community', 'Exclusive member benefits']
              },
              {
                title: 'Unbeatable Interline Rates',
                description: 'Access special pricing and deals available only to travel industry professionals.',
                features: ['Exclusive interline pricing', 'Premium cruise lines', 'Best value guarantee']
              },
              {
                title: 'Expert Support & Service',
                description: 'Our team of cruise specialists provides personalized support throughout your journey.',
                features: ['24/7 customer support', 'Cruise specialists', 'Personalized service']
              }
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 mb-6">{item.description}</p>
                <ul className="space-y-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 text-ocean-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-ocean-600 to-ocean-700">
        <div className="section-container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-ocean-100 mb-8 max-w-2xl mx-auto">
            Become part of the most exclusive cruise booking platform for travel professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="btn bg-white text-ocean-600 hover:bg-gray-50 px-8 py-3">
              Join Now
            </a>
            <a href="/login" className="btn border-2 border-white text-white hover:bg-white hover:text-ocean-600 px-8 py-3">
              Member Login
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}