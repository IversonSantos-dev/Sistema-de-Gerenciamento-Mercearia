import { ScalePluDialog } from "@/components/ScalePluDialog";
import { useLocation } from "wouter";

export default function ScalePluManagement() {
  const [, setLocation] = useLocation();
  return <ScalePluDialog open onOpenChange={open => { if (!open) setLocation("/produtos"); }} />;
}
