import React from 'react';
import { Scale, AlertCircle, CheckCircle2, Gavel, HelpCircle } from 'lucide-react';

interface WinMeter {
    partyA: number;
    partyB: number;
}

interface Action {
    who: 'A' | 'B' | 'both';
    action: string;
}

interface AIMediatorResponse {
    type: 'ack' | 'ask' | 'judgement';
    text: string;
    win_meter?: WinMeter;
    actions?: Action[];
    clarify?: string;
}

interface AIMediatorMessageProps {
    content: string;
}

const AIMediatorMessage: React.FC<AIMediatorMessageProps> = ({ content }) => {
    let parsedContent: AIMediatorResponse | null = null;

    try {
        parsedContent = JSON.parse(content);
    } catch (e) {
        // Fallback for non-JSON content (legacy or error)
        return <p className="text-sm leading-relaxed">{content}</p>;
    }

    if (!parsedContent) return null;

    const { type, text, win_meter, actions, clarify } = parsedContent;

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ack': return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
            case 'ask': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
            case 'judgement': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'ack': return 'Acknowledged';
            case 'ask': return 'Clarification Needed';
            case 'judgement': return 'Judgement Passed';
            default: return 'Message';
        }
    };

    return (
        <div className="space-y-3 w-full">
            {/* One-line Header */}
            <div className="text-xs font-bold text-ai-mediator-foreground/80 uppercase tracking-widest">
                {getTypeLabel(type)}
            </div>

            {/* Main Text */}
            <div className="text-sm leading-relaxed font-medium">
                {text}
            </div>

            {/* Actions */}
            {actions && actions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
                    <div className="grid gap-2">
                        {actions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-background/40 p-2 rounded border border-border/50">
                                <div className={`
                  shrink-0 h-5 px-1.5 rounded flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary
                `}>
                                    {action.who}
                                </div>
                                <span className="text-sm">{action.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clarification - Matching Actions Format */}
            {clarify && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clarification Needed</p>
                    <div className="flex items-start gap-2 bg-background/40 p-2 rounded border border-border/50">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm">{clarify}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIMediatorMessage;
