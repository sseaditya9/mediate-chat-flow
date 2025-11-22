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
            case 'ack': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ask': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'judgement': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'ack': return <CheckCircle2 className="w-4 h-4" />;
            case 'ask': return <HelpCircle className="w-4 h-4" />;
            case 'judgement': return <Gavel className="w-4 h-4" />;
            default: return <Scale className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-3 w-full">
            {/* Header with Type Badge */}
            <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(type)}`}>
                    {getTypeIcon(type)}
                    <span className="uppercase tracking-wide">{type}</span>
                </div>
            </div>

            {/* Win-O-Meter REMOVED (Moved to Header) */}

            {/* Main Text */}
            <div className="text-sm leading-relaxed font-medium">
                {text}
            </div>

            {/* Actions */}
            {actions && actions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-black/5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
                    <div className="grid gap-2">
                        {actions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-white/50 p-2 rounded border border-black/5">
                                <div className={`
                  shrink-0 h-5 px-1.5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-primary
                `}>
                                    {action.who}
                                </div>
                                <span className="text-sm">{action.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clarification */}
            {clarify && (
                <div className="flex items-start gap-2 bg-amber-50 text-amber-900 p-2.5 rounded border border-amber-100 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                        <span className="font-semibold block text-xs uppercase text-amber-700 mb-0.5">Clarification Needed</span>
                        {clarify}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIMediatorMessage;
