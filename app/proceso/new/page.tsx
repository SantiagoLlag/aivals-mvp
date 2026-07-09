import { FLAGS } from "@/lib/flags";
import NewProcessForm from "./NewProcessForm";

export const dynamic = "force-dynamic";

export default function NewProcess() {
  return <NewProcessForm linkedinImport={FLAGS.linkedinImport} />;
}
