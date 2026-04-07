import { useState, useCallback, useRef, useMemo } from "react";
import {
    MapPin,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Shield,
    Navigation,
    AlertTriangle,
} from "lucide-react";
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    Circle,
    Autocomplete,
} from "@react-google-maps/api";
import { cn } from "@/lib/utils";
import { showSuccess, showApiError } from "@/lib/toast";
import {
    useGeofences,
    useCreateGeofence,
    useUpdateGeofence,
    useDeleteGeofence,
    useSetDefaultGeofence,
} from "@/features/company-admin/api/use-geofence-queries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeofenceManagerProps {
    locationId: string;
    companyId: string;
    locationLat?: string;
    locationLng?: string;
}

interface GeofenceFormState {
    name: string;
    lat: number;
    lng: number;
    radius: number;
    address: string;
    isDefault: boolean;
}

interface GeofenceRecord {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    address?: string | null;
    isDefault: boolean;
    isActive: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 15;
const RADIUS_PRESETS = [50, 100, 200, 300, 500, 1000];
const MAP_LIBRARIES: ("places")[] = ["places"];

const MAP_CONTAINER_STYLE: React.CSSProperties = {
    width: "100%",
    height: "100%",
    minHeight: 400,
};

const ACTIVE_CIRCLE_OPTIONS: google.maps.CircleOptions = {
    fillColor: "rgba(79,70,229,0.15)",
    fillOpacity: 0.3,
    strokeColor: "#4F46E5",
    strokeWeight: 2,
    clickable: false,
};

const INACTIVE_CIRCLE_OPTIONS: google.maps.CircleOptions = {
    fillColor: "rgba(156,163,175,0.15)",
    fillOpacity: 0.2,
    strokeColor: "#9CA3AF",
    strokeWeight: 1,
    clickable: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyForm(lat: number, lng: number): GeofenceFormState {
    return { name: "", lat, lng, radius: 200, address: "", isDefault: false };
}

function radiusLabel(r: number) {
    return r >= 1000 ? `${r / 1000}km` : `${r}m`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormField({
    label,
    value,
    onChange,
    placeholder,
    mono = false,
    type = "text",
    readOnly = false,
    hint,
}: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    mono?: boolean;
    type?: string;
    readOnly?: boolean;
    hint?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                readOnly={readOnly}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                    mono && "font-mono",
                    readOnly && "cursor-default opacity-70",
                )}
            />
            {hint && (
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    {hint}
                </p>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function GeofenceManager({
    locationId,
    companyId,
    locationLat,
    locationLng,
}: GeofenceManagerProps) {
    // ---- Data fetching ----
    const { data: geofenceData, isLoading } = useGeofences(locationId);
    const createMutation = useCreateGeofence();
    const updateMutation = useUpdateGeofence();
    const deleteMutation = useDeleteGeofence();
    const setDefaultMutation = useSetDefaultGeofence();

    const geofences: GeofenceRecord[] = useMemo(
        () => (geofenceData?.data as GeofenceRecord[] | undefined) ?? [],
        [geofenceData],
    );

    // ---- Location center ----
    const locationCenter = useMemo(() => {
        const lat = locationLat ? parseFloat(locationLat) : NaN;
        const lng = locationLng ? parseFloat(locationLng) : NaN;
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        return INDIA_CENTER;
    }, [locationLat, locationLng]);

    // ---- UI state ----
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formState, setFormState] = useState<GeofenceFormState>(
        emptyForm(locationCenter.lat, locationCenter.lng),
    );
    const [mapCenter, setMapCenter] = useState(locationCenter);
    const [deleteTarget, setDeleteTarget] = useState<GeofenceRecord | null>(
        null,
    );

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(
        null,
    );
    const mapRef = useRef<google.maps.Map | null>(null);

    // ---- Google Maps loader ----
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded: mapsLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries: MAP_LIBRARIES,
    });

    const hasApiKey = apiKey.length > 0;
    const isEditing = isAdding || editingId !== null;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    // ---- Helpers ----
    const patchForm = useCallback(
        (patch: Partial<GeofenceFormState>) =>
            setFormState((prev) => ({ ...prev, ...patch })),
        [],
    );

    const resetEditing = useCallback(() => {
        setEditingId(null);
        setIsAdding(false);
        setFormState(emptyForm(locationCenter.lat, locationCenter.lng));
    }, [locationCenter]);

    const startAdding = useCallback(() => {
        setEditingId(null);
        setIsAdding(true);
        const form = emptyForm(locationCenter.lat, locationCenter.lng);
        setFormState(form);
        setMapCenter(locationCenter);
        mapRef.current?.panTo(locationCenter);
    }, [locationCenter]);

    const startEditing = useCallback(
        (gf: GeofenceRecord) => {
            setIsAdding(false);
            setEditingId(gf.id);
            const center = { lat: gf.lat, lng: gf.lng };
            setFormState({
                name: gf.name,
                lat: gf.lat,
                lng: gf.lng,
                radius: gf.radius,
                address: gf.address ?? "",
                isDefault: gf.isDefault,
            });
            setMapCenter(center);
            mapRef.current?.panTo(center);
        },
        [],
    );

    // ---- Map callbacks ----
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        map.setCenter(locationCenter);
    }, []);

    const onMarkerDragEnd = useCallback(
        (e: google.maps.MapMouseEvent) => {
            const lat = e.latLng?.lat();
            const lng = e.latLng?.lng();
            if (lat !== undefined && lng !== undefined) {
                patchForm({ lat, lng });
            }
        },
        [patchForm],
    );

    const onPlaceChanged = useCallback(() => {
        const place = autocompleteRef.current?.getPlace();
        if (!place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address ?? "";
        patchForm({ lat, lng, address });
        setMapCenter({ lat, lng });
        const map = mapRef.current;
        if (map) {
            map.panTo({ lat, lng });
            map.setZoom(16);
        }
    }, [patchForm]);

    // ---- Mutations ----
    const handleSave = useCallback(async () => {
        if (!formState.name.trim()) return;
        const payload = {
            name: formState.name.trim(),
            lat: formState.lat,
            lng: formState.lng,
            radius: formState.radius,
            address: formState.address.trim() || undefined,
            isDefault: formState.isDefault,
        };
        try {
            if (isAdding) {
                await createMutation.mutateAsync({
                    locationId,
                    data: payload,
                });
                showSuccess("Geofence Created", `${payload.name} has been added.`);
            } else if (editingId) {
                await updateMutation.mutateAsync({
                    locationId,
                    id: editingId,
                    data: payload,
                });
                showSuccess("Geofence Updated", `${payload.name} has been saved.`);
            }
            resetEditing();
        } catch {
            // Error shown by mutation onError
        }
    }, [
        formState,
        isAdding,
        editingId,
        locationId,
        createMutation,
        updateMutation,
        resetEditing,
    ]);

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync({
                locationId,
                id: deleteTarget.id,
            });
            showSuccess(
                "Geofence Deleted",
                `${deleteTarget.name} has been removed.`,
            );
            if (editingId === deleteTarget.id) resetEditing();
            setDeleteTarget(null);
        } catch {
            // Error shown by mutation onError
        }
    }, [deleteTarget, locationId, deleteMutation, editingId, resetEditing]);

    const handleSetDefault = useCallback(
        async (gf: GeofenceRecord) => {
            try {
                await setDefaultMutation.mutateAsync({
                    locationId,
                    id: gf.id,
                });
                showSuccess("Default Updated", `${gf.name} is now the default geofence.`);
            } catch {
                // Error shown by mutation onError
            }
        },
        [locationId, setDefaultMutation],
    );

    // ---- Render ----
    return (
        <div className="flex h-full min-h-[520px] rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
            {/* ================= LEFT PANEL ================= */}
            <div className="w-80 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                {/* Header */}
                <div className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                Geofences
                            </h3>
                            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                                {geofences.length}
                            </span>
                        </div>
                        <button
                            onClick={startAdding}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors shadow-sm"
                        >
                            <Plus size={14} />
                            Add
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : geofences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                <MapPin
                                    size={24}
                                    className="text-neutral-400"
                                />
                            </div>
                            <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                                No geofences configured
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-[200px]">
                                Add one to enable location-based attendance
                                tracking
                            </p>
                        </div>
                    ) : (
                        geofences.map((gf) => (
                            <button
                                key={gf.id}
                                onClick={() => startEditing(gf)}
                                className={cn(
                                    "group w-full text-left rounded-xl border p-3 transition-all duration-150",
                                    editingId === gf.id
                                        ? "border-l-4 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-md"
                                        : "border-neutral-200 dark:border-neutral-700 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900",
                                )}
                            >
                                {/* Top row */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate flex-1">
                                        {gf.name}
                                    </span>
                                    {gf.isDefault && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase tracking-wide">
                                            <Shield size={10} />
                                            Default
                                        </span>
                                    )}
                                </div>

                                {/* Address */}
                                {gf.address && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mb-2">
                                        {gf.address}
                                    </p>
                                )}

                                {/* Bottom row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium">
                                            <Navigation size={10} />
                                            {radiusLabel(gf.radius)}
                                        </span>
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                                                gf.isActive
                                                    ? "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400"
                                                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    gf.isActive
                                                        ? "bg-success-500"
                                                        : "bg-neutral-400",
                                                )}
                                            />
                                            {gf.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>

                                    {/* Actions (visible on hover) */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!gf.isDefault && (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSetDefault(gf);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.stopPropagation();
                                                        handleSetDefault(gf);
                                                    }
                                                }}
                                                className="p-1 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 cursor-pointer"
                                                title="Set as default"
                                            >
                                                <Shield size={14} />
                                            </span>
                                        )}
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(gf);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.stopPropagation();
                                                    startEditing(gf);
                                                }
                                            }}
                                            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
                                            title="Edit"
                                        >
                                            <Edit3 size={14} />
                                        </span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(gf);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.stopPropagation();
                                                    setDeleteTarget(gf);
                                                }
                                            }}
                                            className="p-1 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 text-danger-500 cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* ================= RIGHT PANEL ================= */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Map area */}
                <div className="flex-1 relative rounded-tr-2xl overflow-hidden">
                    {!hasApiKey ? (
                        /* Fallback when no API key */
                        <div className="flex flex-col items-center justify-center h-full bg-neutral-50 dark:bg-neutral-800/50 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-warning-100 dark:bg-warning-900/20 flex items-center justify-center mb-4">
                                <AlertTriangle
                                    size={32}
                                    className="text-warning-600 dark:text-warning-400"
                                />
                            </div>
                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
                                Google Maps API key not configured
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-6">
                                Add your API key to{" "}
                                <code className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-xs font-mono">
                                    VITE_GOOGLE_MAPS_API_KEY
                                </code>{" "}
                                in your .env file to enable the map.
                            </p>
                            {isEditing && (
                                <div className="w-full max-w-sm space-y-3">
                                    <FormField
                                        label="Latitude"
                                        value={String(formState.lat)}
                                        onChange={(v) =>
                                            patchForm({
                                                lat: parseFloat(v) || 0,
                                            })
                                        }
                                        type="number"
                                        mono
                                    />
                                    <FormField
                                        label="Longitude"
                                        value={String(formState.lng)}
                                        onChange={(v) =>
                                            patchForm({
                                                lng: parseFloat(v) || 0,
                                            })
                                        }
                                        type="number"
                                        mono
                                    />
                                </div>
                            )}
                        </div>
                    ) : !mapsLoaded ? (
                        /* Loading skeleton */
                        <div className="h-full bg-neutral-100 dark:bg-neutral-800 animate-pulse flex items-center justify-center">
                            <Loader2
                                size={32}
                                className="text-neutral-400 animate-spin"
                            />
                        </div>
                    ) : (
                        /* Google Map */
                        <>
                            <GoogleMap
                                mapContainerStyle={MAP_CONTAINER_STYLE}
                                zoom={DEFAULT_ZOOM}
                                onLoad={onMapLoad}
                                options={{
                                    disableDefaultUI: false,
                                    zoomControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: true,
                                }}
                            >
                                {/* Places search bar */}
                                {isEditing && (
                                    <div className="absolute top-3 left-3 right-3 z-10">
                                        <Autocomplete
                                            onLoad={(ac) => {
                                                autocompleteRef.current = ac;
                                            }}
                                            onPlaceChanged={onPlaceChanged}
                                        >
                                            <div className="relative">
                                                <Search
                                                    size={16}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Search for a place..."
                                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                                                />
                                            </div>
                                        </Autocomplete>
                                    </div>
                                )}

                                {/* Existing geofences as gray circles */}
                                {geofences
                                    .filter((gf) => gf.id !== editingId)
                                    .map((gf) => (
                                        <Circle
                                            key={`circle-${gf.id}`}
                                            center={{
                                                lat: gf.lat,
                                                lng: gf.lng,
                                            }}
                                            radius={gf.radius}
                                            options={INACTIVE_CIRCLE_OPTIONS}
                                        />
                                    ))}

                                {/* Existing geofences markers */}
                                {geofences
                                    .filter((gf) => gf.id !== editingId)
                                    .map((gf) => (
                                        <Marker
                                            key={`marker-${gf.id}`}
                                            position={{
                                                lat: gf.lat,
                                                lng: gf.lng,
                                            }}
                                            opacity={0.5}
                                            title={gf.name}
                                        />
                                    ))}

                                {/* Active editing marker + circle */}
                                {isEditing && (
                                    <>
                                        <Marker
                                            position={{
                                                lat: formState.lat,
                                                lng: formState.lng,
                                            }}
                                            draggable
                                            onDragEnd={onMarkerDragEnd}
                                            title="Drag to set position"
                                        />
                                        <Circle
                                            center={{
                                                lat: formState.lat,
                                                lng: formState.lng,
                                            }}
                                            radius={formState.radius}
                                            options={ACTIVE_CIRCLE_OPTIONS}
                                        />
                                    </>
                                )}
                            </GoogleMap>
                        </>
                    )}
                </div>

                {/* ================= EDIT FORM ================= */}
                {isEditing && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {isAdding
                                        ? "New Geofence"
                                        : "Edit Geofence"}
                                </h4>
                                <button
                                    onClick={resetEditing}
                                    className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <FormField
                                    label="Name"
                                    value={formState.name}
                                    onChange={(v) => patchForm({ name: v })}
                                    placeholder="e.g. Main Office"
                                />

                                {/* Coordinates */}
                                <FormField
                                    label="Coordinates"
                                    value={`${formState.lat.toFixed(6)}, ${formState.lng.toFixed(6)}`}
                                    readOnly
                                    mono
                                    hint={
                                        hasApiKey
                                            ? "Drag marker or search to set"
                                            : "Enter manually above"
                                    }
                                />

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <FormField
                                        label="Address"
                                        value={formState.address}
                                        onChange={(v) =>
                                            patchForm({ address: v })
                                        }
                                        placeholder="Auto-filled from search or enter manually"
                                    />
                                </div>
                            </div>

                            {/* Radius selector */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                    Radius
                                </label>
                                <div className="flex flex-wrap items-center gap-2">
                                    {RADIUS_PRESETS.map((r) => (
                                        <button
                                            key={r}
                                            onClick={() =>
                                                patchForm({ radius: r })
                                            }
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                                formState.radius === r
                                                    ? "bg-primary-600 text-white shadow-sm"
                                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                                            )}
                                        >
                                            {radiusLabel(r)}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            value={
                                                RADIUS_PRESETS.includes(
                                                    formState.radius,
                                                )
                                                    ? ""
                                                    : formState.radius
                                            }
                                            onChange={(e) => {
                                                const v = parseInt(
                                                    e.target.value,
                                                    10,
                                                );
                                                if (v > 0) patchForm({ radius: v });
                                            }}
                                            placeholder="Custom"
                                            className="w-20 px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400"
                                        />
                                        <span className="text-xs text-neutral-400">
                                            m
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Default checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formState.isDefault}
                                    onChange={(e) =>
                                        patchForm({
                                            isDefault: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500/20"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                    Set as default geofence
                                </span>
                            </label>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                <button
                                    onClick={handleSave}
                                    disabled={
                                        isSaving || !formState.name.trim()
                                    }
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
                                >
                                    {isSaving && (
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                    )}
                                    {isAdding ? "Create Geofence" : "Save Changes"}
                                </button>
                                <button
                                    onClick={resetEditing}
                                    className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ================= DELETE CONFIRMATION OVERLAY ================= */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
                                <Trash2
                                    size={20}
                                    className="text-danger-600 dark:text-danger-400"
                                />
                            </div>
                            <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                                Delete Geofence
                            </h4>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                            This will permanently delete{" "}
                            <strong className="text-neutral-900 dark:text-white">
                                {deleteTarget.name}
                            </strong>
                            . This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                            >
                                {deleteMutation.isPending && (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
