import { VoiceCloner } from "../../app/components/VoiceCloner";

export default function VoicePage() {
  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Voice Cloning</h1>
        <p className="mt-2 text-sm text-gray-500">Create or upload a voice model — local demo.</p>
        <VoiceCloner />
      </div>
    </main>
  );
}
