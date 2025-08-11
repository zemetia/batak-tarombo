import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { FilePenLine, UserPlus, CheckCircle, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const processSteps = [
    {
        icon: UserPlus,
        title: "Register an Account",
        description: "To maintain data integrity, all contributors need an account. This is a one-time step to get you started."
    },
    {
        icon: FilePenLine,
        title: "Submit Your Knowledge",
        description: "Use our dedicated submission form to add new ancestors. Provide their name and father to ensure correct placement."
    },
    {
        icon: Clock,
        title: "Admin Review",
        description: "Our knowledgeable admins review every submission for accuracy against existing records."
    },
    {
        icon: CheckCircle,
        title: "See Your Impact",
        description: "Once approved, your contribution is added to the lineage, preserving your heritage for all."
    }
];

export default function ContributePage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">

        {/* Header Section */}
        <header className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Become a Guardian of Our Heritage</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your knowledge is the missing piece of a grand puzzle. By contributing to the Batak lineage, you help preserve our collective story for generations to come.
          </p>
        </header>

        {/* Why Contribute Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1">
                <h2 className="text-3xl font-headline font-bold mb-4">The Power of a Single Name</h2>
                <div className="space-y-4 text-muted-foreground">
                    <p>
                        A <span className="font-semibold text-foreground">tarombo</span> is the lifeblood of Batak identity, a sacred thread connecting us to our past. In a world of constant change, the digital preservation of this knowledge is not just important—it's essential.
                    </p>
                    <p>
                        When you add a name, you're doing more than filling a blank space. You are restoring a connection, honoring an ancestor, and providing a beacon for future generations to find their way home. Each submission strengthens the entire tree, making it a more complete and accurate resource for everyone.
                    </p>
                </div>
            </div>
            <div className="order-1 md:order-2">
                <Image 
                    src="https://placehold.co/600x400"
                    alt="Historic Batak village"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                    data-ai-hint="heritage document"
                />
            </div>
        </div>

        {/* How it Works Section */}
        <div className="mb-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-headline font-bold">The Contribution Journey</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">We've designed a straightforward process to ensure every piece of information is added with care and accuracy.</p>
            </div>
            <div className="relative">
                {/* Desktop Dashed Line */}
                <div className="hidden lg:block absolute top-8 left-0 w-full h-px bg-transparent">
                    <svg className="w-full" height="2">
                        <line x1="0" y1="1" x2="100%" y2="1" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="8, 8"/>
                    </svg>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative">
                    {processSteps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                           <div key={index} className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-6 border-2 border-primary/20 relative z-10 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <h3 className="font-bold font-headline text-xl mb-2">{step.title}</h3>
                                <p className="text-muted-foreground text-sm">{step.description}</p>
                           </div>
                        )
                    })}
                </div>
            </div>
        </div>
        
        {/* Call to Action Section */}
        <div>
             <Card className="bg-primary/5 border-primary/20">
                <div 
                className="grid md:grid-cols-2 items-center rounded-lg p-8"
                style={{
                    backgroundImage: 'url(/images/gorga.jpg)',
                    backgroundRepeat: 'repeat-x',
                    backgroundSize: 'auto 100%',
                }}
                >
                    <div className="p-8 md:p-12 bg-white rounded-lg">
                        <h2 className="text-3xl font-headline font-bold mb-4">Ready to Share Your Story?</h2>
                        <p className="text-muted-foreground mb-6">
                            Your journey to preserving Batak heritage starts here. Create an account or sign in to access the contribution form and add your family's branch to our shared tree.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg">
                                <Link href="/signup">
                                    <UserPlus className="mr-2" />
                                    Create an Account
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="secondary">
                                <Link href="/login">
                                    Sign In to Contribute
                                </Link>
                            </Button>
                        </div>
                    </div>
                     
                </div>
            </Card>
        </div>

      </div>
    </div>
  )
}
