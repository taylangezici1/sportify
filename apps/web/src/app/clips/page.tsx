"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Clip } from "@repo/ui";
import { clipToTrack } from "@repo/ui";
import { api, ApiError } from "@/lib/client-api";
import { useModeActions } from "@/components/layout/useModeActions";
import ClipsView from "@/components/clips/ClipsView";
import ClipperModal from "@/components/clips/ClipperModal";
import { IconFlame, IconScissors } from "@/components/ui/Icons";
import { Button, EmptyState, Page, PageHeader, Spinner } from "@/components/ui/primitives";

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [editing, setEditing] = useState<Clip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Clip | null>(null);
  const { start, starting } = useModeActions();

  const load = useCallback(
    () =>
      api.clips
        .list()
        .then(setClips)
        .catch((e) => {
          toast.error(e instanceof ApiError ? e.message : "Could not load clips.");
          setClips([]);
        }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    const clip = pendingDelete;
    if (!clip) return;
    setPendingDelete(null);
    setClips((c) => c?.filter((x) => x.id !== clip.id) ?? null);
    try {
      await api.clips.remove(clip.id);
      toast.success("Clip deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete the clip.");
      void load();
    }
  };

  return (
    <Page>
      <PageHeader
        title="Clips"
        subtitle="Every clip plays from its start to its end, then the next one starts."
        actions={
          <>
            <Link href="/search">
              <Button icon={<IconScissors size={16} />}>New clip</Button>
            </Link>
            <Button
              variant="workout"
              icon={<IconFlame size={16} />}
              loading={starting === "workout"}
              onClick={() => start("workout", { force: true })}
              disabled={!clips || clips.length === 0}
            >
              Shuffle all
            </Button>
          </>
        }
      />

      {clips === null ? (
        <Spinner label="Loading clips" />
      ) : clips.length === 0 ? (
        <EmptyState
          icon={<IconScissors size={40} />}
          title="No clips yet"
          description="Search for a track, hit Clip, drag the handles around the part you love, save."
          action={
            <Link href="/search">
              <Button variant="primary">Go to search</Button>
            </Link>
          }
        />
      ) : (
        <ClipsView clips={clips} onEdit={setEditing} onDelete={setPendingDelete} />
      )}

      {editing && (
        <ClipperModal
          track={clipToTrack(editing)}
          clip={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => setClips((c) => c?.map((x) => (x.id === saved.id ? saved : x)) ?? null)}
        />
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPendingDelete(null)}
          role="alertdialog"
          aria-modal
          aria-label="Delete clip"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-bold">Delete this clip?</h2>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-text">{pendingDelete.trackName}</span> will be removed. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingDelete(null)} autoFocus>
                Keep
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
