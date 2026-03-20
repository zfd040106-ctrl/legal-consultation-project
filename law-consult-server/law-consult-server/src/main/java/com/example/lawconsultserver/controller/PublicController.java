package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.common.response.PageResponse;
import com.example.lawconsultserver.mapper.AnnouncementMapper;
import com.example.lawconsultserver.mapper.CarouselItemMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 鍏紑鎺ュ彛鎺у埗鍣?
 */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private static final int DEFAULT_PAGE_SIZE = 10;

    @Autowired
    private AnnouncementMapper announcementMapper;

    @Autowired
    private CarouselItemMapper carouselItemMapper;

    @GetMapping("/announcements")
    public ApiResponse<?> getAnnouncements(@RequestParam(defaultValue = "1") Integer page,
                                           @RequestParam(defaultValue = "10") Integer pageSize) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;
        long total = announcementMapper.countAll(null, "published");
        var announcements = announcementMapper.selectAll(null, "published", offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, announcements));
    }

    @GetMapping("/carousels")
    public ApiResponse<?> getCarousels() {
        return ApiResponse.success(carouselItemMapper.selectPublicActive());
    }
}
