import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { idb } from "@/lib/utils";

type LibraryItem = {
  id: string;
  title: string;
  subject?: string;
  date: string;
  fileUrl?: string;
};

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    (async () => {
      const saved = (await idb.get<LibraryItem[]>("metadata", "library")) || [];
      setItems(saved);
    })();
  }, []);

  return (
    <div className="pb-20" data-testid="page-library">
      <Header title="My Library" />
      <div className="p-4">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-muted-foreground mb-2">download</span>
              <p className="text-muted-foreground">No saved items yet</p>
              <p className="text-xs text-muted-foreground mt-1">Save PDFs to view offline</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{it.title}</p>
                      <p className="text-xs text-muted-foreground">{it.subject || "General"} • {it.date}</p>
                    </div>
                    {it.fileUrl ? (
                      <a className="text-sm underline" href={it.fileUrl} target="_blank">Open</a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}


