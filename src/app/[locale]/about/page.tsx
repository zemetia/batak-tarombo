import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCopy, Globe, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations('AboutPage');
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
      <div className="relative z-10 bg-[#7B1E1E] text-white py-24">
         <div className="absolute inset-0 overflow-hidden">
             <Image
                src="/images/lake-toba.png"
                alt="Lake Toba"
                fill
                className="object-cover opacity-20"
                priority
             />
         </div>
         <div className="container mx-auto px-4 relative text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">{t('title')}</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 leading-relaxed">
                {t('subtitle')}
            </p>
         </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10 space-y-24">
        
        {/* Section 1: Who are the Batak */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B1E1E]/10 text-[#7B1E1E] font-medium text-sm">
                    <Globe className="w-4 h-4" />
                    <span>North Sumatra, Indonesia</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-[#7B1E1E]">
                    {t('sections.one.title')}
                </h2>
                <div className="text-lg text-muted-foreground space-y-4">
                     <p>{t.rich('sections.one.content1', {
                          bold: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>
                        })}</p>
                     <p>{t.rich('sections.one.content2', {
                          bold: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>
                        })}</p>
                </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 rotate-2 hover:rotate-0 transition-transform duration-500">
                 <Image
                    src="/images/batak-house.png"
                    alt="Batak Traditional House"
                    fill
                    className="object-cover"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                     <span className="text-white font-medium">Rumah Bolon - The Great House</span>
                 </div>
            </div>
        </section>

        {/* Section 2: Dalihan Na Tolu (The 3 Pillars) */}
        <section className="text-center space-y-12">
             <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-[#7B1E1E]">
                    {t('sections.two.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                    {t.rich('sections.two.content1', {
                        bold: (chunks) => <span className="font-bold text-[#7B1E1E]">{chunks}</span>
                    })}
                </p>
                <div className="h-1 w-24 bg-[#7B1E1E] mx-auto rounded-full" />
             </div>

             <div className="grid md:grid-cols-3 gap-8">
                {['hula', 'boru', 'dongan'].map((item, idx) => (
                    <Card key={item} className="bg-background border-[#7B1E1E]/20 hover:border-[#7B1E1E] transition-colors group">
                        <CardContent className="pt-8 px-6 pb-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-[#7B1E1E]/5 group-hover:bg-[#7B1E1E] transition-colors flex items-center justify-center mx-auto text-[#7B1E1E] group-hover:text-white mb-6">
                                <span className="text-2xl font-bold">{idx + 1}</span>
                            </div>
                            <h3 className="text-xl font-bold font-headline capitalize">
                                {item === 'hula' ? 'Somba Marhula-hula' : item === 'boru' ? 'Elek Marboru' : 'Manat Mardongan Tubu'}
                            </h3>
                        </CardContent>
                    </Card>
                ))}
             </div>
             
             <p className="max-w-3xl mx-auto text-muted-foreground italic border-l-4 border-[#7B1E1E] pl-4 text-left bg-[#7B1E1E]/5 p-4 rounded-r-lg">
                "{t.rich('sections.two.content2', {
                    bold: (chunks) => <span className="font-semibold text-[#7B1E1E]">{chunks}</span>
                })}"
             </p>
        </section>

        {/* Section 3: Tarombo & Mission */}
        <section className="bg-[#7B1E1E] text-white rounded-3xl p-8 md:p-16 overflow-hidden relative">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            
            <div className="grid lg:grid-cols-2 gap-16 relative z-10">
                <div className="space-y-8">
                    <BookCopy className="w-12 h-12 text-white/80" />
                    <div>
                        <h2 className="text-3xl font-headline font-bold mb-4">{t('sections.three.title')}</h2>
                        <div className="space-y-6 text-white/90 text-lg leading-relaxed">
                            <p>{t.rich('sections.three.content1', {
                                bold: (chunks) => <span className="font-bold text-white">{chunks}</span>
                            })}</p>
                            <p>{t('sections.three.content2')}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-6 border border-white/10">
                    <h3 className="text-2xl font-headline font-bold">{t('sections.four.title')}</h3>
                    <div className="space-y-4">
                        {['batak', 'indonesia', 'world'].map((key) => (
                            <div key={key} className="flex gap-4">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-white mt-2" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{t(`sections.four.cards.${key}.title`)}</h4>
                                    <p className="text-white/80 text-sm">{t(`sections.four.cards.${key}.desc`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Section 5: CTA */}
        <section className="text-center max-w-4xl mx-auto space-y-8 py-12">
             <h2 className="text-3xl md:text-5xl font-headline font-bold">
                {t('sections.five.title')}
             </h2>
             <p className="text-xl text-muted-foreground">
                {t.rich('sections.five.content', {
                    bold: (chunks) => <span className="font-serif italic text-2xl block my-6 text-[#7B1E1E]">{chunks}</span>
                })}
             </p>
             <div className="pt-8">
                <Button asChild size="lg" className="h-14 px-8 text-lg bg-[#7B1E1E] hover:bg-[#5a1616] text-white shadow-xl hover:translate-y-[-2px] transition-all">
                    <Link href="/contribute">
                        {t('sections.five.button')}
                    </Link>
                </Button>
             </div>
        </section>

      </div>
    </div>
  );
}
