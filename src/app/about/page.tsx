import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCopy, Globe, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        
        <header className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">The Legacy of the Batak People</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A journey into the heart of a unique Indonesian culture, its sacred lineage traditions, and the global effort to preserve it for future generations.
          </p>
        </header>

        <div className="space-y-12">
            
            <Card className="overflow-hidden md:grid md:grid-cols-2 items-center">
                <CardHeader className="p-0 md:order-2">
                    <Image
                        src="https://placehold.co/600x400"
                        alt="Batak cultural ceremony"
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        data-ai-hint="batak culture"
                    />
                </CardHeader>
                <div className="p-8 md:p-12 md:order-1">
                    <BookCopy className="w-10 h-10 text-primary mb-4" />
                    <h2 className="font-headline text-3xl font-bold mb-4">1. Who are the Batak?</h2>
                    <div className="text-muted-foreground space-y-4">
                        <p>The Batak are one of Indonesia’s most prominent ethnic groups, originating from the stunning highlands of North Sumatra surrounding Lake Toba. Comprising several distinct sub-groups, each with its own dialect and customs, the Batak people are united by a shared identity and a rich cultural tapestry.</p>
                        <p>They are renowned for their vibrant arts, intricate wood carvings, unique architecture—most famously the Jabu Bolon traditional houses—and a deep-rooted system of customs known as <span className="font-semibold text-foreground">adat</span> that governs social life.</p>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden md:grid md:grid-cols-2 items-center">
                 <CardHeader className="p-0">
                    <Image
                        src="https://placehold.co/600x400"
                        alt="An old tarombo manuscript"
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        data-ai-hint="ancient manuscript"
                    />
                </CardHeader>
                <div className="p-8 md:p-12">
                    <Users className="w-10 h-10 text-primary mb-4" />
                    <h2 className="font-headline text-3xl font-bold mb-4">2. The Keeper of Lineage: Tarombo</h2>
                    <div className="text-muted-foreground space-y-4">
                        <p>At the core of Batak identity is the <span className="font-semibold text-foreground">tarombo</span>, a genealogical record that meticulously traces patrilineal descent from a common ancestor, Si Raja Batak. More than a mere family tree, the tarombo is a sacred inheritance that defines a person's <span className="font-semibold text-foreground">marga</span> (clan), establishes social standing, and dictates familial relationships and obligations.</p>
                        <p>Traditionally, tarombos were carefully memorized and passed down orally or inscribed on materials like bamboo or tree bark. This tradition of lineage-keeping is a fundamental pillar of Batak culture, connecting the present generation to their ancestral roots.</p>
                    </div>
                </div>
            </Card>

             <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="items-center text-center p-8">
                     <Sparkles className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="font-headline text-3xl">3. Why This Website Was Created</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 text-muted-foreground space-y-4 max-w-4xl mx-auto">
                    <p>In a fast-globalizing world, ancient traditions face the risk of being forgotten. Oral histories can fade, and physical manuscripts can be lost to time. This website was born from a collective desire to safeguard the invaluable knowledge held within the Batak tarombo.</p>
                    <p>Our mission is to create a comprehensive, accessible, and permanent digital archive of Batak genealogy. By leveraging technology, we can consolidate disparate records, correct inconsistencies through community collaboration, and ensure this cornerstone of Batak identity is preserved securely for generations to come. It is a modern solution to an age-old responsibility: protecting our heritage.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="items-center text-center p-8">
                    <Globe className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="font-headline text-3xl">4. A Contribution to the World</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 grid md:grid-cols-3 gap-8 text-muted-foreground">
                    <div className="text-center">
                        <h3 className="font-semibold text-lg text-foreground mb-2">For the Batak People</h3>
                        <p>This project provides a central hub for Batak individuals worldwide to explore their roots, understand their connections, and contribute to their shared story. It strengthens the bonds of the global Batak diaspora.</p>
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold text-lg text-foreground mb-2">For Indonesia</h3>
                        <p>The Batak tarombo is a vital piece of Indonesia's diverse cultural puzzle. Digitizing it enriches the national archive and showcases the profound depth of the archipelago's heritage to the rest of the country.</p>
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold text-lg text-foreground mb-2">For the World</h3>
                        <p>This project serves as a global resource for academics, historians, and anyone interested in genealogy and anthropology. It offers a unique insight into a sophisticated kinship system and preserves a piece of human history.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center max-w-3xl mx-auto">
                 <h2 className="font-headline text-3xl font-bold mb-4">5. Be Proud of Your Heritage</h2>
                 <p className="text-muted-foreground text-lg mb-8">
                    Being Batak is to carry a legacy of resilience, community, and profound respect for ancestry. Your lineage is a story written over centuries. We encourage every Batak person, near and far, to embrace this heritage with pride. Explore your tarombo, share the stories of your ancestors, and help us ensure that this beautiful tradition continues to thrive in the digital age.
                 </p>
                 <Button asChild size="lg">
                    <Link href="/contribute">
                        Learn How to Contribute
                    </Link>
                 </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
