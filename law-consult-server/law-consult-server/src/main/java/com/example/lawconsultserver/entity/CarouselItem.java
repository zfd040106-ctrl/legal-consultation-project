package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 杞挱鍥剧洰
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarouselItem {
    private Integer id;
    private Integer adminId;
    private String title;
    private String summary;
    private String content;
    private String imageUrl;
    private String category;
    private Integer sortOrder;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
