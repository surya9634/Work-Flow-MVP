"use client"

import {
    ChartNetworkIcon,
    ImageIcon,
    MapIcon,
    PenToolIcon,
    ScanTextIcon,
    SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const AiAssistantCard = () => {
    return (
        <Card className="flex h-full min-h-[600px] w-full flex-col gap-6 p-4 shadow-none border-0 bg-transparent">
            <div className="flex flex-row items-center justify-end p-0">
                <Button variant="ghost" size="icon" className="size-8">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                        className="size-4 text-muted-foreground"
                    >
                        <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0M4 19a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"
                        />
                    </svg>
                </Button>
            </div>
            <CardContent className="flex flex-1 flex-col p-0">
                <div className="flex flex-col items-center justify-center space-y-8 p-6">
                    <svg
                        fill="none"
                        height="48"
                        viewBox="0 0 48 48"
                        width="48"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                        <filter
                            id="a"
                            colorInterpolationFilters="sRGB"
                            filterUnits="userSpaceOnUse"
                            height="54"
                            width="48"
                            x="0"
                            y="-3"
                        >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend
                                in="SourceGraphic"
                                in2="BackgroundImageFix"
                                mode="normal"
                                result="shape"
                            />
                            <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            />
                            <feOffset dy="-3" />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite
                                in2="hardAlpha"
                                k2="-1"
                                k3="1"
                                operator="arithmetic"
                            />
                            <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                            />
                            <feBlend
                                in2="shape"
                                mode="normal"
                                result="effect1_innerShadow_3051_46851"
                            />
                            <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            />
                            <feOffset dy="3" />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite
                                in2="hardAlpha"
                                k2="-1"
                                k3="1"
                                operator="arithmetic"
                            />
                            <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"
                            />
                            <feBlend
                                in2="effect1_innerShadow_3051_46851"
                                mode="normal"
                                result="effect2_innerShadow_3051_46851"
                            />
                            <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            />
                            <feMorphology
                                in="SourceAlpha"
                                operator="erode"
                                radius="1"
                                result="effect3_innerShadow_3051_46851"
                            />
                            <feOffset />
                            <feComposite
                                in2="hardAlpha"
                                k2="-1"
                                k3="1"
                                operator="arithmetic"
                            />
                            <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.24 0"
                            />
                            <feBlend
                                in2="effect2_innerShadow_3051_46851"
                                mode="normal"
                                result="effect3_innerShadow_3051_46851"
                            />
                        </filter>
                        <filter
                            id="b"
                            colorInterpolationFilters="sRGB"
                            filterUnits="userSpaceOnUse"
                            height="42"
                            width="42"
                            x="3"
                            y="5.25"
                        >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            />
                            <feMorphology
                                in="SourceAlpha"
                                operator="erode"
                                radius="1.5"
                                result="effect1_dropShadow_3051_46851"
                            />
                            <feOffset dy="2.25" />
                            <feGaussianBlur stdDeviation="2.25" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix
                                type="matrix"
                                values="0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0.1 0"
                            />
                            <feBlend
                                in2="BackgroundImageFix"
                                mode="normal"
                                result="effect1_dropShadow_3051_46851"
                            />
                            <feBlend
                                in="SourceGraphic"
                                in2="effect1_dropShadow_3051_46851"
                                mode="normal"
                                result="shape"
                            />
                        </filter>
                        <linearGradient
                            id="c"
                            gradientUnits="userSpaceOnUse"
                            x1="24"
                            x2="26"
                            y1=".000001"
                            y2="48"
                        >
                            <stop offset="0" stopColor="#fff" stopOpacity="0" />
                            <stop offset="1" stopColor="#fff" stopOpacity=".12" />
                        </linearGradient>
                        <linearGradient
                            id="d"
                            gradientUnits="userSpaceOnUse"
                            x1="24"
                            x2="24"
                            y1="6"
                            y2="42"
                        >
                            <stop offset="0" stopColor="#fff" stopOpacity=".8" />
                            <stop offset="1" stopColor="#fff" stopOpacity=".5" />
                        </linearGradient>
                        <linearGradient
                            id="e"
                            gradientUnits="userSpaceOnUse"
                            x1="24"
                            x2="24"
                            y1="0"
                            y2="48"
                        >
                            <stop offset="0" stopColor="#fff" stopOpacity=".12" />
                            <stop offset="1" stopColor="#fff" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id="f">
                            <rect height="48" rx="12" width="48" />
                        </clipPath>
                        <g filter="url(#a)">
                            <g clipPath="url(#f)">
                                <rect fill="#0A0D12" height="48" rx="12" width="48" />
                                <path d="m0 0h48v48h-48z" fill="url(#c)" />
                                <g filter="url(#b)">
                                    <path
                                        clipRule="evenodd"
                                        d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z"
                                        fill="url(#d)"
                                        fillRule="evenodd"
                                    />
                                </g>
                            </g>
                            <rect
                                height="46"
                                rx="11"
                                stroke="url(#e)"
                                strokeWidth="2"
                                width="46"
                                x="1"
                                y="1"
                            />
                        </g>
                    </svg>

                    <div className="flex flex-col space-y-2.5 text-center">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-medium tracking-tight text-white/90">
                                Hi, I'm Zap.
                            </h2>
                            <h3 className="text-lg font-medium tracking-[-0.006em] text-white/90">
                                I can update settings, campaigns, and more.
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Just tell me "Set voice to female" or "Create a campaign".
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge
                            variant="secondary"
                            className="h-7 min-w-7 cursor-pointer gap-1.5 [&_svg]:-ms-px [&_svg]:shrink-0 text-xs [&_svg]:size-3.5 rounded-md"
                        >
                            <ImageIcon aria-hidden="true" className="text-blue-500" />
                            Change Persona
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="h-7 min-w-7 cursor-pointer gap-1.5 [&_svg]:-ms-px [&_svg]:shrink-0 text-xs [&_svg]:size-3.5 rounded-md"
                        >
                            <ChartNetworkIcon
                                aria-hidden="true"
                                className="text-orange-500"
                            />
                            Analyze Leads
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="h-7 min-w-7 cursor-pointer gap-1.5 [&_svg]:-ms-px [&_svg]:shrink-0 text-xs [&_svg]:size-3.5 rounded-md"
                        >
                            <MapIcon aria-hidden="true" className="text-green-500" />
                            New Campaign
                        </Badge>
                    </div>
                </div>

                <div className="relative mt-auto flex-col rounded-md ring-1 ring-border">
                    <div className="relative">
                        <Textarea
                            placeholder="Ask me anything..."
                            className="peer bg-transparent min-h-[100px] resize-none rounded-b-none border-none py-3 ps-9 pe-9 shadow-none text-white/90 focus-visible:ring-0"
                        />

                        <div className="pointer-events-none absolute start-0 top-[14px] flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                viewBox="0 0 24 24"
                                className="size-4"
                            >
                                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="11.5" cy="11.5" r="9.5" />
                                    <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                                </g>
                            </svg>
                        </div>

                        <button
                            className="absolute end-0 bottom-7 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-colors outline-none hover:text-foreground focus:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Send"
                            type="button"
                        >
                            <div className="size-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                <SparklesIcon className="size-4" />
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-b-md border-t bg-muted/50 px-3 py-2 dark:bg-muted">
                        <div className="flex items-center gap-1">
                            <Button className="h-7! px-2! gap-2 text-xs" variant="ghost">
                                <ImageIcon className="size-3.5" /> Attach
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
