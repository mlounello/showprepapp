-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "lengthIn" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "weightLbs" DOUBLE PRECISION,
    "defaultContents" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'IN_SHOP',
    "currentLocation" TEXT NOT NULL DEFAULT 'Shop',
    "ownerLabel" TEXT,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lengthIn" DOUBLE PRECISION,
    "widthIn" DOUBLE PRECISION,
    "heightIn" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "TruckProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowTruck" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "loadRank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShowTruck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowCase" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "ownerId" TEXT,
    "ownerRole" TEXT,
    "truckLabel" TEXT,
    "zoneLabel" TEXT,
    "overrideNotes" TEXT,
    "loadOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShowCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "showId" TEXT,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "truckLabel" TEXT,
    "zoneLabel" TEXT,
    "note" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TruckProfile_name_key" ON "TruckProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ShowTruck_showId_truckId_key" ON "ShowTruck"("showId", "truckId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowCase_showId_caseId_key" ON "ShowCase"("showId", "caseId");

-- AddForeignKey
ALTER TABLE "ShowTruck" ADD CONSTRAINT "ShowTruck_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowTruck" ADD CONSTRAINT "ShowTruck_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "TruckProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowCase" ADD CONSTRAINT "ShowCase_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowCase" ADD CONSTRAINT "ShowCase_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowCase" ADD CONSTRAINT "ShowCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "CrewMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

