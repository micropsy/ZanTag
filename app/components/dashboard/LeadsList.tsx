import { type Contact } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { format } from "date-fns";
import { Mail, Phone, Calendar, Tag, Inbox } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface LeadsListProps {
  leads: (Omit<Contact, "createdAt" | "updatedAt"> & { 
    createdAt: string | Date; 
    updatedAt: string | Date; 
  })[];
}

export function LeadsList({ leads }: LeadsListProps) {
  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Captured Leads</CardTitle>
        <CardDescription>
          A list of all contacts captured via your profile forms and OCR scans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden md:table-cell">Captured At</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-semibold">{lead.name}</span>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      lead.source === "FORM" ? "bg-teal-50 text-teal-700 border-teal-100" :
                      lead.source === "OCR" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      "bg-slate-50 text-slate-700 border-slate-100"
                    }>
                      <Tag className="w-3 h-3 mr-1" /> {lead.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-[200px] truncate hidden lg:table-cell">
                    {lead.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState 
                      icon={Inbox} 
                      title="No Leads Yet" 
                      description="Share your profile to start capturing leads from your connections."
                      className="border-none bg-transparent py-12"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
