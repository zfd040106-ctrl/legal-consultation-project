package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.CarouselItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CarouselItemMapper {
    int insertCarouselItem(CarouselItem carouselItem);

    List<CarouselItem> selectPublicActive();

    List<CarouselItem> selectAll(@Param("keyword") String keyword,
                                 @Param("status") String status,
                                 @Param("offset") Long offset,
                                 @Param("limit") Integer limit);

    Long countAll(@Param("keyword") String keyword, @Param("status") String status);

    CarouselItem selectById(@Param("id") Integer id);

    int updateCarouselItem(CarouselItem carouselItem);

    int deleteById(@Param("id") Integer id);
}
