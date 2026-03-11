"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote, Star } from "lucide-react"
import { motion, useAnimation, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface Testimonial {
    id: number
    name: string
    role: string
    company: string
    content: string
    rating: number
    avatar: string
    highlight?: string
}

export interface AnimatedTestimonialsProps {
    title?: string
    subtitle?: string
    badgeText?: string
    testimonials?: Testimonial[]
    autoRotateInterval?: number
    trustedCompanies?: string[]
    trustedCompaniesTitle?: string
    className?: string
}

export function AnimatedTestimonials({
    title = "Loved by the community",
    subtitle = "Don't just take our word for it. See what developers and companies have to say about our starter template.",
    badgeText = "Trusted by developers",
    testimonials = [],
    autoRotateInterval = 6000,
    trustedCompanies = [],
    trustedCompaniesTitle = "Trusted by developers from companies worldwide",
    className,
}: AnimatedTestimonialsProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
    const controls = useAnimation()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut" as const,
            },
        },
    }

    useEffect(() => {
        if (isInView) {
            controls.start("visible")
        }
    }, [isInView, controls])

    useEffect(() => {
        if (autoRotateInterval <= 0 || testimonials.length <= 1) return

        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length)
        }, autoRotateInterval)

        return () => clearInterval(interval)
    }, [autoRotateInterval, testimonials.length])

    if (testimonials.length === 0) {
        return null
    }

    return (
        <section
            ref={sectionRef}
            id="testimonials"
            className={cn("py-24 overflow-hidden", className)}
        >
            <div className="px-6 max-w-7xl mx-auto">
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                    className="grid grid-cols-1 gap-16 w-full md:grid-cols-2 lg:gap-24"
                >
                    {/* Left side: Heading and navigation */}
                    <motion.div variants={itemVariants} className="flex flex-col justify-center">
                        <div className="space-y-6">
                            {badgeText && (
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Star className="mr-1.5 h-3.5 w-3.5 fill-purple-400 text-purple-400" />
                                    <span>{badgeText}</span>
                                </div>
                            )}

                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                                {title}
                            </h2>

                            <p className="max-w-[600px] text-zinc-400 md:text-xl/relaxed">
                                {subtitle}
                            </p>

                            <div className="flex items-center gap-3 pt-4">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveIndex(index)}
                                        className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === index
                                            ? "w-10 bg-purple-500"
                                            : "w-2.5 bg-zinc-700 hover:bg-zinc-600"
                                            }`}
                                        aria-label={`View testimonial ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right side: Testimonial cards */}
                    <motion.div variants={itemVariants} className="relative h-full min-h-[300px] md:min-h-[400px]">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.id}
                                className="absolute inset-0"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{
                                    opacity: activeIndex === index ? 1 : 0,
                                    x: activeIndex === index ? 0 : 100,
                                    scale: activeIndex === index ? 1 : 0.9,
                                }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                style={{ zIndex: activeIndex === index ? 10 : 0 }}
                            >
                                <div className="bg-zinc-900/80 border border-zinc-800 shadow-2xl shadow-purple-500/5 rounded-2xl p-8 h-full flex flex-col backdrop-blur-sm">
                                    <div className="mb-6 flex gap-1.5">
                                        {Array(testimonial.rating)
                                            .fill(0)
                                            .map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                            ))}
                                    </div>

                                    <div className="relative mb-6 flex-1">
                                        <Quote className="absolute -top-2 -left-2 h-8 w-8 text-purple-500/20 rotate-180" />
                                        <p className="relative z-10 text-lg font-medium leading-relaxed text-zinc-200">
                                            &ldquo;{testimonial.content}&rdquo;
                                        </p>
                                        {testimonial.highlight && (
                                            <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                                                <span className="text-sm font-semibold text-purple-400">{testimonial.highlight}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-px w-full bg-zinc-800 my-4" />

                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-9 w-9 border border-zinc-700">
                                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-300">
                                                {testimonial.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-white">{testimonial.name}</h3>
                                            <p className="text-sm text-zinc-500">
                                                {testimonial.role}, {testimonial.company}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Decorative elements */}
                        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-xl bg-purple-500/5 border border-purple-500/10" />
                        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-xl bg-purple-500/5 border border-purple-500/10" />
                    </motion.div>
                </motion.div>

                {/* Logo cloud */}
                {trustedCompanies.length > 0 && (
                    <motion.div variants={itemVariants} initial="hidden" animate={controls} className="mt-24 text-center">
                        <h3 className="text-sm font-medium text-zinc-600 mb-8 uppercase tracking-widest">
                            {trustedCompaniesTitle}
                        </h3>
                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                            {trustedCompanies.map((company) => (
                                <div key={company} className="text-2xl font-semibold text-zinc-700">
                                    {company}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    )
}
