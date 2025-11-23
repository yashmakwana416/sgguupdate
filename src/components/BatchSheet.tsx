import React from 'react';
import { format } from 'date-fns';

interface BatchSheetProps {
    batch: any;
    companyDetails: {
        name: string;
        address: string;
        mobile: string;
        tagline: string;
        signature_name: string;
    };
}

export const BatchSheet: React.FC<BatchSheetProps> = ({ batch, companyDetails }) => {
    return (
        <div className="w-full bg-white text-slate-900 p-8" id="batch-sheet-content">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{companyDetails.name}</h1>
                    <div className="text-sm text-slate-600 space-y-1">
                        <p>{companyDetails.address}</p>
                        <p>Mobile: {companyDetails.mobile}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[200px]">
                        <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">BATCH SHEET</h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Batch Date</p>
                                <p className="font-medium">{format(new Date(batch.created_at), 'PPP')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Batch ID</p>
                                <p className="font-mono text-sm">{batch.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Batch Name</p>
                        <p className="font-semibold text-lg text-slate-900">{batch.batch_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Materials</p>
                        <p className="font-semibold text-lg text-slate-900">{batch.batch_items?.length || 0} Items</p>
                    </div>
                </div>
            </div>

            {/* Materials Table */}
            <div className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Raw Materials Used
                </h3>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-200">
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">No.</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Material Name</th>
                            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {batch.batch_items?.map((item: any, index: number) => (
                            <tr key={item.id}>
                                <td className="py-3 px-4 text-sm text-slate-500">{index + 1}</td>
                                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                    {item.raw_materials?.display_name || item.raw_materials?.name || 'Unknown Material'}
                                </td>
                                <td className="py-3 px-4 text-right text-sm font-medium text-slate-900">
                                    {item.quantity_kg > 0 && `${item.quantity_kg} kg`}
                                    {item.quantity_kg > 0 && item.quantity_grams > 0 && ' '}
                                    {item.quantity_grams > 0 && `${item.quantity_grams} g`}
                                </td>
                            </tr>
                        ))}
                        {(!batch.batch_items || batch.batch_items.length === 0) && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-500 italic">
                                    No raw materials recorded for this batch.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details / Notes */}
            {batch.batch_details && (
                <div className="mb-8">
                    <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider">Batch Notes</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                        {batch.batch_details}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-400">
                        <p>Generated on {format(new Date(), 'PPP p')}</p>
                        <p>System Generated Document</p>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-slate-900 mb-1">{companyDetails.tagline}</div>
                        <div className="text-sm text-slate-600 mb-4">{companyDetails.signature_name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-2">
                            Authorized Signature
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
