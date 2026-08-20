import { useEffect, useRef, useState } from "react";
import cloudIcon from "@assets/icons/SellerCentre/CloudArrowUp.svg";
import placeholderIcon from "@assets/icons/SellerCentre/Image.svg";

/** The dropzone holds five slots — same cap as `images` => max:5 on the API. */
export const MAX_PRODUCT_IMAGES = 5;

/* Matches `images.*` => max:2048 on the API side, and the "Max 2MB" note
   printed inside the drop zone. */
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * The five image slots.
 *
 * An entry is either a File the seller just picked, or — when editing — an
 * { id, url } for an image the product already has on the server. The parent
 * owns the list, because saving has to tell the two apart.
 */
export default function ProductImageDropZone({ images, onChange }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    /* Object URLs are handed to <img>, so they have to outlive the render and
       be released when the file is dropped from the list. */
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const urls = images.map((image) =>
            image instanceof File ? URL.createObjectURL(image) : image.url
        );

        setPreviews(urls);

        return () => {
            urls.forEach((url, index) => {
                if (images[index] instanceof File) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [images]);

    function addFiles(fileList) {
        const picked = Array.from(fileList).filter((file) =>
            file.type.startsWith("image/")
        );

        // Caught here rather than after the whole form has been filled in and
        // the API rejects the upload.
        const tooLarge = picked.filter((file) => file.size > MAX_BYTES);

        if (tooLarge.length) {
            alert(
                "These images are larger than 2MB and were skipped:\n" +
                    tooLarge.map((file) => file.name).join("\n")
            );
        }

        const accepted = picked.filter((file) => file.size <= MAX_BYTES);
        const room = MAX_PRODUCT_IMAGES - images.length;

        onChange([...images, ...accepted.slice(0, room)]);
    }

    return (
        <>
            <div
                className={
                    dragging ? "productImageDropZone dragover" : "productImageDropZone"
                }
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setDragging(false);
                    }
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    multiple
                    hidden
                    onChange={(event) => {
                        addFiles(event.target.files);

                        // So picking the same file twice in a row still fires.
                        event.target.value = "";
                    }}
                />

                <img src={cloudIcon} alt="" className="productImageDropZoneIcon" />

                <p className="productImageDropZoneText">Upload Image</p>

                <p className="productImageDropZoneInfo">
                    PNG, JPG, JPEG (Max 2MB)
                    <br />
                    For best results, use a square 1000 × 1000px
                </p>
            </div>

            <div className="productImageCards">
                {Array.from({ length: MAX_PRODUCT_IMAGES }, (unused, index) => (
                    <div
                        key={index}
                        className="productImageCard"
                        onClick={() => {
                            if (!images[index]) {
                                return;
                            }

                            onChange(images.filter((image, at) => at !== index));
                        }}
                    >
                        {images[index] ? (
                            <img
                                src={previews[index]}
                                alt={`Product image ${index + 1}`}
                                className="productImageCardPreview"
                            />
                        ) : (
                            <img
                                src={placeholderIcon}
                                alt=""
                                className="productImageCardIcon"
                            />
                        )}
                    </div>
                ))}
            </div>

            <p className="productImageLimit">Max {MAX_PRODUCT_IMAGES} images</p>
        </>
    );
}
