package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.PageResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.temporal.Temporal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MediaAssetService {

    private static final Set<String> DIRECT_URL_FIELDS = Set.of(
            "avatar", "userAvatar", "lawyerAvatar", "imageUrl", "documentUrl", "url"
    );

    private static final String UPLOAD_PREFIX = "/uploads/";
    private static final String MISSING_IMAGE_PATH = "/placeholders/image-missing.svg";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8080/uploads/}")
    private String uploadBaseUrl;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        rootLocation = resolveUploadRoot();
    }

    public String sanitizeStoredPath(String rawValue) {
        if (StringUtils.isBlank(rawValue)) {
            return null;
        }

        String trimmed = rawValue.trim();
        if (isTemporaryLocalPath(trimmed)) {
            return null;
        }

        String uploadRelativePath = extractUploadRelativePath(trimmed);
        if (uploadRelativePath != null) {
            return uploadRelativePath;
        }

        if (isAbsoluteUrl(trimmed)) {
            return trimmed;
        }

        return normalizeRelativePath(trimmed);
    }

    public List<String> sanitizeStoredPaths(List<String> rawValues) {
        List<String> normalizedValues = new ArrayList<>();
        if (rawValues == null || rawValues.isEmpty()) {
            return normalizedValues;
        }

        for (String rawValue : rawValues) {
            String normalized = sanitizeStoredPath(rawValue);
            if (StringUtils.isNotBlank(normalized)) {
                normalizedValues.add(normalized);
            }
        }
        return normalizedValues;
    }

    public void normalizeResponsePayload(Object payload) {
        if (payload == null) {
            return;
        }
        processObject(payload, java.util.Collections.newSetFromMap(new IdentityHashMap<>()));
    }

    public String normalizeAttachmentPayload(String rawValue) {
        if (StringUtils.isBlank(rawValue)) {
            return rawValue;
        }

        boolean jsonArray = true;
        List<String> rawItems;
        try {
            rawItems = objectMapper.readValue(rawValue, new TypeReference<List<String>>() {});
        } catch (Exception ignored) {
            jsonArray = false;
            rawItems = java.util.Arrays.stream(rawValue.split(","))
                    .map(String::trim)
                    .filter(StringUtils::isNotBlank)
                    .toList();
        }

        List<String> normalizedItems = new ArrayList<>();
        for (String item : rawItems) {
            String normalized = normalizeDirectUrl(item);
            if (StringUtils.isNotBlank(normalized)) {
                normalizedItems.add(normalized);
            }
        }

        if (normalizedItems.isEmpty()) {
            return null;
        }

        try {
            return jsonArray ? objectMapper.writeValueAsString(normalizedItems) : String.join(",", normalizedItems);
        } catch (Exception ignored) {
            return String.join(",", normalizedItems);
        }
    }

    public String normalizeStoredAvatar(String rawValue) {
        return sanitizeStoredPath(rawValue);
    }

    public String normalizeStoredDocumentUrl(String rawValue) {
        return sanitizeStoredPath(rawValue);
    }

    public String normalizeStoredImageUrl(String rawValue) {
        return sanitizeStoredPath(rawValue);
    }

    private void processObject(Object value, Set<Object> visited) {
        if (value == null || isSimpleValue(value.getClass())) {
            return;
        }
        if (visited.contains(value)) {
            return;
        }
        visited.add(value);

        if (value instanceof PageResponse<?> pageResponse) {
            processObject(pageResponse.getItems(), visited);
            return;
        }

        if (value instanceof Map<?, ?> map) {
            processMap((Map<Object, Object>) map, visited);
            return;
        }

        if (value instanceof Collection<?> collection) {
            for (Object item : collection) {
                processObject(item, visited);
            }
            return;
        }

        Class<?> currentClass = value.getClass();
        while (currentClass != null
                && currentClass != Object.class
                && currentClass.getPackageName().startsWith("com.example.lawconsultserver")) {
            for (Field field : currentClass.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
                    continue;
                }

                try {
                    field.setAccessible(true);
                    Object fieldValue = field.get(value);
                    if (fieldValue == null) {
                        continue;
                    }

                    if (fieldValue instanceof String stringValue && shouldNormalizeField(field.getName())) {
                        String normalizedValue = normalizeFieldValue(field.getName(), stringValue);
                        if (!StringUtils.equals(stringValue, normalizedValue)) {
                            field.set(value, normalizedValue);
                        }
                    } else {
                        processObject(fieldValue, visited);
                    }
                } catch (IllegalAccessException ignored) {
                    // Ignore inaccessible fields and continue processing the rest.
                }
            }
            currentClass = currentClass.getSuperclass();
        }
    }

    private void processMap(Map<Object, Object> map, Set<Object> visited) {
        for (Map.Entry<Object, Object> entry : map.entrySet()) {
            Object key = entry.getKey();
            Object entryValue = entry.getValue();
            if (!(key instanceof String fieldName) || entryValue == null) {
                processObject(entryValue, visited);
                continue;
            }

            if (entryValue instanceof String stringValue && shouldNormalizeField(fieldName)) {
                String normalizedValue = normalizeFieldValue(fieldName, stringValue);
                try {
                    entry.setValue(normalizedValue);
                } catch (UnsupportedOperationException ignored) {
                    // Keep original value when the backing map is immutable.
                }
            } else {
                processObject(entryValue, visited);
            }
        }
    }

    private boolean shouldNormalizeField(String fieldName) {
        return DIRECT_URL_FIELDS.contains(fieldName) || "attachments".equals(fieldName);
    }

    private String normalizeFieldValue(String fieldName, String rawValue) {
        if ("attachments".equals(fieldName)) {
            return normalizeAttachmentPayload(rawValue);
        }
        return normalizeDirectUrl(rawValue);
    }

    private String normalizeDirectUrl(String rawValue) {
        if (StringUtils.isBlank(rawValue)) {
            return rawValue;
        }

        String normalized = sanitizeStoredPath(rawValue);
        if (StringUtils.isBlank(normalized)) {
            return null;
        }

        if (isAbsoluteUrl(normalized) && extractUploadRelativePath(normalized) == null) {
            return normalized;
        }

        String relativePath = extractUploadRelativePath(normalized);
        if (relativePath == null) {
            relativePath = normalizeRelativePath(normalized);
        }
        if (StringUtils.isBlank(relativePath)) {
            return null;
        }
        return buildUploadUrl(relativePath);
    }

    private String buildUploadUrl(String relativePath) {
        String normalizedRelativePath = removeLeadingSlash(relativePath);
        String baseUrl = removeTrailingSlash(resolvePublicRootUrl()) + UPLOAD_PREFIX + normalizedRelativePath;
        return appendCacheVersion(baseUrl, normalizedRelativePath);
    }

    public String getMissingImageUrl() {
        return removeTrailingSlash(resolvePublicRootUrl()) + MISSING_IMAGE_PATH;
    }

    public Path getRootLocation() {
        return rootLocation;
    }

    public String buildPublicUploadUrl(String relativePath) {
        String normalizedRelativePath = normalizeRelativePath(relativePath);
        if (StringUtils.isBlank(normalizedRelativePath)) {
            return null;
        }
        return buildUploadUrl(normalizedRelativePath);
    }

    public boolean isImagePath(String path) {
        if (StringUtils.isBlank(path)) {
            return false;
        }
        String lower = path.toLowerCase();
        return lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".gif")
                || lower.endsWith(".webp")
                || lower.endsWith(".bmp")
                || lower.endsWith(".svg");
    }

    private String resolvePublicRootUrl() {
        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        } catch (Exception ignored) {
            String configured = StringUtils.defaultIfBlank(uploadBaseUrl, "http://localhost:8080/uploads/");
            String normalized = configured.replace("\\", "/");
            if (normalized.endsWith("/")) {
                normalized = normalized.substring(0, normalized.length() - 1);
            }
            if (normalized.endsWith("/uploads")) {
                normalized = normalized.substring(0, normalized.length() - "/uploads".length());
            }
            return normalized;
        }
    }

    private Path resolveUploadRoot() {
        String configuredPath = StringUtils.defaultIfBlank(uploadDir, "uploads/");
        Path configured = Paths.get(configuredPath);
        if (configured.isAbsolute()) {
            return configured.normalize();
        }

        Path projectRoot = resolveProjectRoot();
        Path projectUploadRoot = projectRoot.resolve(configured).normalize();
        if (Files.exists(projectUploadRoot)) {
            return projectUploadRoot;
        }

        Path currentWorkingUploadRoot = configured.toAbsolutePath().normalize();
        if (Files.exists(currentWorkingUploadRoot)) {
            return currentWorkingUploadRoot;
        }

        return projectUploadRoot;
    }

    private Path resolveProjectRoot() {
        Path cwdRoot = findProjectRoot(Paths.get("").toAbsolutePath().normalize());
        if (cwdRoot != null) {
            return cwdRoot;
        }

        Path applicationHome = new ApplicationHome(MediaAssetService.class).getDir().toPath().toAbsolutePath().normalize();
        Path appRoot = findProjectRoot(applicationHome);
        if (appRoot != null) {
            return appRoot;
        }

        return applicationHome;
    }

    private Path findProjectRoot(Path startPath) {
        Path current = startPath;
        while (current != null) {
            if (Files.exists(current.resolve("pom.xml"))) {
                return current;
            }
            current = current.getParent();
        }
        return null;
    }

    private String extractUploadRelativePath(String rawValue) {
        if (StringUtils.isBlank(rawValue)) {
            return null;
        }

        String normalizedRawValue = rawValue.replace("\\", "/");
        if (normalizedRawValue.startsWith("/uploads/")) {
            return normalizeRelativePath(normalizedRawValue.substring("/uploads/".length()));
        }
        if (normalizedRawValue.startsWith("uploads/")) {
            return normalizeRelativePath(normalizedRawValue.substring("uploads/".length()));
        }

        if (!isAbsoluteUrl(normalizedRawValue)) {
            return null;
        }

        try {
            URI uri = URI.create(normalizedRawValue);
            String path = uri.getPath();
            if (StringUtils.isBlank(path)) {
                return null;
            }

            int uploadIndex = path.indexOf(UPLOAD_PREFIX);
            if (uploadIndex < 0) {
                return null;
            }

            return normalizeRelativePath(path.substring(uploadIndex + UPLOAD_PREFIX.length()));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeRelativePath(String rawPath) {
        if (StringUtils.isBlank(rawPath)) {
            return null;
        }

        String candidate = rawPath.trim().replace("\\", "/");
        while (candidate.startsWith("/")) {
            candidate = candidate.substring(1);
        }
        if (candidate.startsWith("uploads/")) {
            candidate = candidate.substring("uploads/".length());
        }

        Path normalizedPath = Paths.get(candidate).normalize();
        String normalized = normalizedPath.toString().replace("\\", "/");
        if (StringUtils.isBlank(normalized) || normalized.startsWith("..")) {
            return null;
        }
        return normalized;
    }

    private boolean isTemporaryLocalPath(String rawValue) {
        String lower = rawValue.toLowerCase();
        return lower.startsWith("wxfile://")
                || lower.startsWith("file:/")
                || lower.startsWith("blob:")
                || lower.startsWith("http://tmp/")
                || lower.startsWith("https://tmp/")
                || lower.startsWith("/tmp/")
                || lower.startsWith("tmp/")
                || rawValue.matches("^[a-zA-Z]:\\\\.*");
    }

    private boolean isAbsoluteUrl(String rawValue) {
        String lower = rawValue.toLowerCase();
        return lower.startsWith("http://") || lower.startsWith("https://");
    }

    private boolean isSimpleValue(Class<?> type) {
        if (type.isPrimitive() || type.isEnum()) {
            return true;
        }
        return Number.class.isAssignableFrom(type)
                || CharSequence.class.isAssignableFrom(type)
                || Boolean.class.isAssignableFrom(type)
                || Temporal.class.isAssignableFrom(type)
                || java.util.Date.class.isAssignableFrom(type)
                || java.util.UUID.class.isAssignableFrom(type)
                || type.getPackageName().startsWith("java.");
    }

    private String removeTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String removeLeadingSlash(String value) {
        return value.startsWith("/") ? value.substring(1) : value;
    }

    private String appendCacheVersion(String baseUrl, String relativePath) {
        try {
            Path filePath = rootLocation.resolve(relativePath).normalize();
            if (Files.exists(filePath) && Files.isRegularFile(filePath)) {
                long lastModified = Files.getLastModifiedTime(filePath).toMillis();
                return baseUrl + "?v=" + lastModified;
            }
        } catch (Exception ignored) {
            // Fall back to the plain URL when metadata cannot be read.
        }
        return baseUrl;
    }
}
