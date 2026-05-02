import * as React from "react";
export function AlertDialog({ children, open, onOpenChange, ...props }: any) { return <div {...props}>{open && children}</div>; }
export function AlertDialogTrigger({ children, asChild, ...props }: any) { return <>{children}</>; }
export function AlertDialogContent({ children, ...props }: any) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" {...props}><div className="bg-white rounded-lg p-6 max-w-md mx-4">{children}</div></div>; }
export function AlertDialogHeader({ children, ...props }: any) { return <div className="mb-4" {...props}>{children}</div>; }
export function AlertDialogTitle({ children, ...props }: any) { return <h2 className="text-lg font-semibold" {...props}>{children}</h2>; }
export function AlertDialogDescription({ children, ...props }: any) { return <p className="text-sm text-gray-500" {...props}>{children}</p>; }
export function AlertDialogFooter({ children, ...props }: any) { return <div className="flex justify-end gap-2 mt-4" {...props}>{children}</div>; }
export function AlertDialogAction({ children, ...props }: any) { return <button className="px-4 py-2 bg-primary text-white rounded" {...props}>{children}</button>; }
export function AlertDialogCancel({ children, ...props }: any) { return <button className="px-4 py-2 border rounded" {...props}>{children}</button>; }
