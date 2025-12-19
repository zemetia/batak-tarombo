import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Gift, Users, Trophy } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function DonationPage() {
  const t = useTranslations('DonationPage');
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

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Main Donation Card */}
            <Card className="border-none shadow-2xl overflow-hidden relative bg-card">
                 {/* Decorative Top Strip */}
                <div className="h-2 w-full bg-[#7B1E1E]" 
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #7B1E1E, #7B1E1E 10px, #5a1616 10px, #5a1616 20px)'
                    }}
                />
                
                <div className="grid md:grid-cols-5">
                    {/* Visual Side */}
                    <div className="md:col-span-2 bg-muted relative min-h-[300px] md:min-h-full">
                        <Image 
                            src="/images/batak-house.png" 
                            alt="Cultural Preservation" 
                            fill 
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[#7B1E1E]/80 mix-blend-multiply" />
                        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                             <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                    <span className="font-bold">Community Driven</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6 text-blue-400" />
                                    <span className="font-bold">Volunteer Run</span>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:col-span-3 p-8 md:p-12 space-y-8">
                         <div>
                             <h2 className="text-2xl font-bold font-headline mb-2 text-[#7B1E1E] flex items-center gap-2">
                                <Gift className="w-6 h-6" />
                                Support Our Mission
                             </h2>
                             <p className="text-muted-foreground">help us keep the story alive.</p>
                         </div>

                        <div className="space-y-6 text-muted-foreground leading-relaxed">
                            <p className="border-l-4 border-[#7B1E1E]/20 pl-4 italic">
                                "{t.rich('content.p1', {
                                    bold: (chunks) => <span className="font-semibold text-[#7B1E1E] not-italic">{chunks}</span>
                                })}"
                            </p>
                            <p>{t('content.p2')}</p>
                            <p className="font-medium text-foreground">{t('content.p3')}</p>
                        </div>
                        
                        <div className="pt-4">
                             <Button size="lg" className="w-full bg-[#7B1E1E] hover:bg-[#5a1616] text-white text-lg h-14 shadow-lg hover:shadow-xl transition-all">
                                <Heart className="mr-2 h-5 w-5 fill-current animate-bounce" />
                                {t('button')}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground mt-4">
                                Secure donation processing via standard payment gateways.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Impact Stats (Mockup) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                 <div className="p-6 rounded-2xl bg-white border shadow-sm">
                     <span className="block text-4xl font-bold text-[#7B1E1E] mb-2">100%</span>
                     <span className="text-sm text-muted-foreground">Volunteer Driven</span>
                 </div>
                 <div className="p-6 rounded-2xl bg-white border shadow-sm">
                     <span className="block text-4xl font-bold text-[#7B1E1E] mb-2">24/7</span>
                     <span className="text-sm text-muted-foreground">Server Uptime</span>
                 </div>
                 <div className="p-6 rounded-2xl bg-white border shadow-sm col-span-2 md:col-span-1">
                     <span className="block text-4xl font-bold text-[#7B1E1E] mb-2">∞</span>
                     <span className="text-sm text-muted-foreground">Heritage Preserved</span>
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
}
