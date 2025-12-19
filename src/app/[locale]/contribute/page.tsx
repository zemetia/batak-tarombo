import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FilePenLine, UserPlus, CheckCircle, Clock, TreePalm, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"

const stepsKeys = ['one', 'two', 'three', 'four'] as const;
const stepsIcons = [UserPlus, FilePenLine, Clock, CheckCircle];

export default function ContributePage() {
  const t = useTranslations('ContributePage');
  return (
    <div className="bg-background relative min-h-screen">
      {/* Batak Pattern Background Overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-0" 
        style={{
          backgroundImage: 'url(/images/batak-pattern-bg.png)',
          backgroundSize: '300px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Hero Section */}
      <div className="bg-[#7B1E1E] text-white py-20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
                <Image src="/images/ulos-cloth.png" alt="Pattern" fill className="object-cover" />
           </div>
           <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
               <TreePalm className="w-16 h-16 mx-auto mb-6 opacity-90" />
               <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">{t('header.title')}</h1>
               <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
                    {t('header.subtitle')}
               </p>
           </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10 space-y-24">

        {/* Why Contribute Section */}
        <section className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 space-y-8">
                <h2 className="text-3xl font-headline font-bold text-[#7B1E1E] border-l-4 border-[#7B1E1E] pl-6">
                    {t('why.title')}
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                    <p>
                        {t.rich('why.p1', {bold: (chunks) => <span className="font-bold text-[#7B1E1E]">{chunks}</span>})}
                    </p>
                    <p>
                        {t('why.p2')}
                    </p>
                </div>
            </div>
            <div className="order-1 md:order-2 relative group">
                <div className="absolute inset-0 bg-[#7B1E1E] rounded-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 opacity-20" />
                <Image 
                    src="/images/batak-dance.png"
                    alt="Traditional Batak Dance"
                    width={600}
                    height={400}
                    className="rounded-2xl shadow-xl relative z-10 -rotate-2 group-hover:rotate-0 transition-transform duration-500"
                />
            </div>
        </section>

        {/* How it Works Section */}
        <section className="bg-muted/30 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#7B1E1E]/20 to-transparent" />
             
            <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">{t('how.title')}</h2>
                <p className="text-muted-foreground text-lg">{t('how.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
                 {/* Connection Lines (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[10%] ring-0 w-[80%] h-0.5 bg-gradient-to-r from-[#7B1E1E]/10 via-[#7B1E1E]/40 to-[#7B1E1E]/10 z-0" />

                {stepsKeys.map((key, index) => {
                    const Icon = stepsIcons[index];
                    return (
                        <div key={key} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-20 h-20 rounded-full bg-[#7B1E1E]/5 flex items-center justify-center group-hover:bg-[#7B1E1E] transition-colors">
                                    <Icon className="w-10 h-10 text-[#7B1E1E] group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <h3 className="font-bold font-headline text-xl mb-3">{t(`how.steps.${key}.title`)}</h3>
                            <p className="text-muted-foreground leading-relaxed">{t(`how.steps.${key}.desc`)}</p>
                        </div>
                    )
                })}
            </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="relative">
             <Card className="bg-[#7B1E1E] text-white border-none shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="grid lg:grid-cols-2">
                    <div className="p-12 md:p-16 flex flex-col justify-center space-y-8 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-headline font-bold leading-tight">{t('cta.title')}</h2>
                        <p className="text-xl text-white/90">
                            {t('cta.text')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button asChild size="lg" className="h-14 px-8 bg-white text-[#7B1E1E] hover:bg-white/90 font-bold text-lg">
                                <Link href="/signup">
                                    <UserPlus className="mr-2 w-5 h-5" />
                                    {t('cta.createAccount')}
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="h-14 px-8 border-white/30 text-white hover:bg-white/10 hover:text-white text-lg">
                                <Link href="/login">
                                    {t('cta.signIn')}
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative min-h-[300px] lg:min-h-full bg-black/20">
                         <Image 
                            src="/images/ulos-cloth.png" 
                            alt="Ulos Cloth"
                            fill
                            className="object-cover opacity-60 mix-blend-overlay"
                        />
                         <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#7B1E1E]" />
                    </div>
                </div>
            </Card>
        </section>

      </div>
    </div>
  )
}
