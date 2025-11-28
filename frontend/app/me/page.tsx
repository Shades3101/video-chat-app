import NewRoom from "@/components/NewRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Me() {


    return (
        <div className="min-h-screen flex flex-col bg-background">
            <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                    <Button variant="ghost" className="hover:bg-transparent! cursor-pointer">
                        <Link href={"/"}>
                            <div className="text-xl font-bold tracking-tight">
                                Meet-Clone
                            </div>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-9 w-9 border border-input">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-4 pb-20 space-y-8">
                <div className="text-center space-y-4 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        Video call and meetings from anywhere,{" "}
                        <span className="text-blue-500 block sm:inline">anytime.</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                        Connect with your loved ones seamlessly.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                    <NewRoom/>
                   
                    <div className="relative w-full sm:w-auto flex-1">
                        <Input placeholder="Enter Slug" className="h-12 rounded-xl px-5 w-full bg-muted/50 border-input focus-visible:ring-blue-500" />
                    </div>
                </div>

            </main>
        </div>
    );
}