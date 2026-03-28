export function SessionsHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إدارة الحصص</h1>
        <p className="text-sm text-muted-foreground mt-1">
          عرض وإدارة جميع الحصص في التقويم الأسبوعي
        </p>
      </div>
    </div>
  );
}
