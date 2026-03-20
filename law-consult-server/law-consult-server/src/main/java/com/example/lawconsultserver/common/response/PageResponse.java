package com.example.lawconsultserver.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 分页响应对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private Long total;
    private Integer page;
    private Integer pageSize;
    private java.util.List<T> items;

    public static <T> PageResponse<T> of(Long total, Integer page, Integer pageSize, java.util.List<T> items) {
        return new PageResponse<>(total, page, pageSize, items);
    }
}
